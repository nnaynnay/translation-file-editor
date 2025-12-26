import { Injectable, computed, inject, signal } from '@angular/core';
import { TranslationParserService } from './translation-parser.service';
import { TranslationUnit } from '../models/translation-unit.model';
import { TranslationDocument, ParserFeatures, ExportFormat } from './parsers/translation-parser.interface';

@Injectable({
    providedIn: 'root'
})
export class TranslationStateService {
    private parser = inject(TranslationParserService);

    // State Signals
    readonly rawDocument = signal<TranslationDocument | null>(null);
    readonly fileName = signal<string | null>(null);
    readonly sourceLang = signal<string | undefined>(undefined);
    readonly targetLang = signal<string | undefined>(undefined);
    readonly units = signal<TranslationUnit[]>([]);
    readonly modifiedIds = signal<Set<string>>(new Set());
    readonly documentFormat = signal<string | undefined>(undefined);
    readonly features = signal<ParserFeatures>({ hasSource: true, hasNotes: true });
    readonly supportedExportFormats = signal<ExportFormat[]>([]);

    readonly filterQuery = signal<string>('');
    readonly filterStatus = signal<'all' | 'translated' | 'missing' | 'changed'>('all');

    // Computed Signals
    readonly filteredUnits = computed(() => {
        const query = this.filterQuery().toLowerCase();
        const status = this.filterStatus();
        const features = this.features();
        let all = this.units();

        // 1. Filter by Status
        if (status === 'translated') {
            all = all.filter(u => u.target && u.target.trim() !== '');
        } else if (status === 'missing') {
            all = all.filter(u => !u.target || u.target.trim() === '');
        } else if (status === 'changed') {
            const modified = this.modifiedIds();
            all = all.filter(u => modified.has(u.id));
        }

        // 2. Filter by Query
        if (!query) return all;

        return all.filter(u =>
            u.id.toLowerCase().includes(query) ||
            (features.hasSource && u.source.toLowerCase().includes(query)) ||
            u.target.toLowerCase().includes(query) ||
            (features.hasNotes && u.notes && u.notes.some(n => n.content.toLowerCase().includes(query)))
        );
    });

    readonly totalStats = computed(() => {
        const all = this.units();
        const translated = all.filter(u => u.target && u.target.trim() !== '').length;
        return {
            total: all.length,
            translated,
            missing: all.length - translated,
            changed: this.modifiedIds().size
        };
    });

    // Actions
    async loadFile(file: File): Promise<void> {
        const text = await file.text();
        const result = this.parser.parse(text);

        this.rawDocument.set(result.document);
        this.units.set(result.units);
        this.sourceLang.set(result.sourceLang);
        this.targetLang.set(result.targetLang);
        this.fileName.set(file.name);
        this.documentFormat.set(result.documentFormat);
        this.features.set(this.parser.getFeatures());
        this.supportedExportFormats.set(this.parser.getSupportedExportFormats());
        this.modifiedIds.set(new Set()); // Reset modified tracking
        this.filterStatus.set('all');
    }

    updateTranslation(id: string, newTarget: string) {
        // 1. Update in-memory units signal
        this.units.update(current =>
            current.map(u => u.id === id ? { ...u, target: newTarget } : u)
        );

        // Track modification
        this.modifiedIds.update(ids => {
            const newIds = new Set(ids);
            newIds.add(id);
            return newIds;
        });

        // 2. Update the raw document
        const doc = this.rawDocument();
        if (doc) {
            this.parser.updateUnit(doc, id, newTarget);
        }
    }

    getExportContent(
        format: 'xliff' | 'json',
        jsonFormat?: 'flat' | 'nested' | 'angular'
    ): string {
        const doc = this.rawDocument();
        const currentFormat = this.documentFormat();

        if (format === 'xliff') {
            // For XLIFF, if translatedOnly is true, we might need a more complex serialization
            // but for now, let's assume we just serialize the current doc which has updates.
            // If we really wanted to filter XLIFF, we'd need parser support to remove nodes.
            return doc ? this.parser.serialize(doc) : '';
        }

        // Otherwise generate fresh JSON with requested or detected format
        let targetJsonFormat: 'flat' | 'nested' | 'angular' = jsonFormat || 'flat';
        if (!jsonFormat && currentFormat?.includes('json')) {
            if (currentFormat.includes('nested')) targetJsonFormat = 'nested';
            else if (currentFormat.includes('angular')) targetJsonFormat = 'angular';
        }

        return this.parser.generateJson(this.units(), targetJsonFormat, this.targetLang() || this.sourceLang());
    }
}
