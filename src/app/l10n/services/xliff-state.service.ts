import { Injectable, computed, inject, signal } from '@angular/core';
import { XliffParserService } from './xliff-parser.service';
import { TranslationUnit } from '../models/translation-unit.model';

@Injectable({
    providedIn: 'root'
})
export class XliffStateService {
    private parser = inject(XliffParserService);

    // State Signals
    readonly rawDocument = signal<Document | null>(null);
    readonly fileName = signal<string | null>(null);
    readonly units = signal<TranslationUnit[]>([]);

    readonly filterQuery = signal<string>('');

    // Computed Signals
    readonly filteredUnits = computed(() => {
        const query = this.filterQuery().toLowerCase();
        const all = this.units();
        if (!query) return all;

        return all.filter(u =>
            u.id.toLowerCase().includes(query) ||
            u.source.toLowerCase().includes(query) ||
            u.target.toLowerCase().includes(query) ||
            (u.note && u.note.toLowerCase().includes(query))
        );
    });

    readonly totalStats = computed(() => {
        const all = this.units();
        const translated = all.filter(u => u.target && u.target.trim() !== '').length;
        return {
            total: all.length,
            translated,
            missing: all.length - translated
        };
    });

    // Actions
    async loadFile(file: File): Promise<void> {
        const text = await file.text();
        const result = this.parser.parse(text);

        this.rawDocument.set(result.document);
        this.units.set(result.units);
        this.fileName.set(file.name);
    }

    updateTranslation(id: string, newTarget: string) {
        // 1. Update in-memory units signal
        this.units.update(current =>
            current.map(u => u.id === id ? { ...u, target: newTarget } : u)
        );

        // 2. Update the raw XML document
        const doc = this.rawDocument();
        if (doc) {
            this.parser.updateUnit(doc, id, newTarget);
        }
    }

    getExportContent(format: 'xliff' | 'json'): string {
        if (format === 'xliff') {
            const doc = this.rawDocument();
            return doc ? this.parser.serializeXliff(doc) : '';
        } else {
            return this.parser.generateJson(this.units());
        }
    }
}
