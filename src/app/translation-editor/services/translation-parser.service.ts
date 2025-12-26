import { Injectable } from '@angular/core';
import { TranslationUnit } from '../models/translation-unit.model';
import { JsonParser } from './parsers/json.parser';
import { AngularJsonFormat, ExportFormat, JsonTranslationMap, TranslationDocument, TranslationParser } from './parsers/translation-parser.interface';
import { Xliff12Parser } from './parsers/xliff-12.parser';
import { Xliff2Parser } from './parsers/xliff-2.parser';


@Injectable({
    providedIn: 'root'
})
export class TranslationParserService {
    private parsers: TranslationParser[] = [
        new Xliff12Parser(),
        new Xliff2Parser(),
        new JsonParser()
    ];

    private activeParser: TranslationParser | null = null;
    // Keep track of which parser was used for the current document? 
    // Actually, `parse` returns the document, so subsequent calls needs to know the parser.
    // However, `updateUnit` and `serialize` take the document.
    // A robust way is to re-detect or store the parser associated with the session.
    // For now, let's assume `parse` sets the active parser for the session in this service instance 
    // OR we detect again (less efficient but stateless).
    // Given the state service holds the singleton parser service, stateful is okay for this single-file editor.

    parse(content: string): ReturnType<TranslationParser['parse']> {
        // Find suitable parser
        const parser = this.parsers.find(p => p.canParse(content));
        if (!parser) {
            // Fallback or specific error?
            // Since `version="2.0"` might be missing or minimal, maybe try 1.2 as default if 2.0 check fails?
            // Or simple check:
            if (content.includes('version="2.0"')) {
                this.activeParser = this.parsers.find(p => p instanceof Xliff2Parser) || null;
            } else {
                this.activeParser = this.parsers.find(p => p instanceof Xliff12Parser) || null;
            }
        } else {
            this.activeParser = parser;
        }

        if (!this.activeParser) {
            throw new Error('Unsupported translation file format');
        }

        return this.activeParser.parse(content);
    }

    getFeatures() {
        return this.activeParser?.getFeatures() ?? { hasSource: true, hasNotes: true };
    }

    getSupportedExportFormats(): ExportFormat[] {
        return this.activeParser?.getSupportedExportFormats() ?? [{ type: 'xliff' }];
    }

    updateUnit(document: TranslationDocument, id: string, targetValue: string): void {
        if (!this.activeParser) {
            throw new Error('No active parser. Load a file first.');
        }
        this.activeParser.updateUnit(document, id, targetValue);
    }

    serialize(document: TranslationDocument): string {
        if (!this.activeParser) {
            if (document instanceof Document) {
                const serializer = new XMLSerializer();
                return serializer.serializeToString(document);
            }
            return JSON.stringify(document, null, 2);
        }
        return this.activeParser.serialize(document);
    }

    generateJson(units: TranslationUnit[], format: 'flat' | 'nested' | 'angular' = 'flat', locale?: string): string {
        if (format === 'flat') {
            const output: JsonTranslationMap = {};
            units.forEach(u => {
                output[u.id] = u.target;
            });
            return JSON.stringify(output, null, 2);
        }

        if (format === 'angular') {
            const translations: JsonTranslationMap = {};
            units.forEach(u => {
                translations[u.id] = u.target;
            });
            const output: AngularJsonFormat = {
                locale: locale || '',
                translations
            };
            return JSON.stringify(output, null, 2);
        }

        if (format === 'nested') {
            const output: JsonTranslationMap = {};
            units.forEach(u => {
                const keys = u.id.split('.');
                let current = output;
                for (let i = 0; i < keys.length - 1; i++) {
                    const key = keys[i];
                    if (!current[key] || typeof current[key] !== 'object') {
                        current[key] = {};
                    }
                    current = current[key] satisfies JsonTranslationMap;
                }
                current[keys[keys.length - 1]] = u.target;
            });
            return JSON.stringify(output, null, 2);
        }

        return '';
    }
}
