import { Injectable } from '@angular/core';
import { TranslationUnit } from '../models/translation-unit.model';
import { TranslationParser } from './parsers/translation-parser.interface';
import { Xliff12Parser } from './parsers/xliff-12.parser';
import { Xliff2Parser } from './parsers/xliff-2.parser';


@Injectable({
    providedIn: 'root'
})
export class XliffParserService {
    private parsers: TranslationParser[] = [
        new Xliff12Parser(),
        new Xliff2Parser()
    ];

    private activeParser: TranslationParser | null = null;
    // Keep track of which parser was used for the current document? 
    // Actually, `parse` returns the document, so subsequent calls needs to know the parser.
    // However, `updateUnit` and `serialize` take the document.
    // A robust way is to re-detect or store the parser associated with the session.
    // For now, let's assume `parse` sets the active parser for the session in this service instance 
    // OR we detect again (less efficient but stateless).
    // Given the state service holds the singleton parser service, stateful is okay for this single-file editor.

    parse(xmlContent: string): { document: Document; units: TranslationUnit[] } {
        // Find suitable parser
        const parser = this.parsers.find(p => p.canParse(xmlContent));
        if (!parser) {
            // Fallback or specific error?
            // Since `version="2.0"` might be missing or minimal, maybe try 1.2 as default if 2.0 check fails?
            // Or simple check:
            if (xmlContent.includes('version="2.0"')) {
                this.activeParser = this.parsers.find(p => p instanceof Xliff2Parser) || null;
            } else {
                this.activeParser = this.parsers.find(p => p instanceof Xliff12Parser) || null;
            }
        } else {
            this.activeParser = parser;
        }

        if (!this.activeParser) {
            throw new Error('Unsupported XLIFF version');
        }

        return this.activeParser.parse(xmlContent);
    }

    updateUnit(document: Document, id: string, targetValue: string): void {
        if (!this.activeParser) {
            throw new Error('No active parser. Load a file first.');
        }
        this.activeParser.updateUnit(document, id, targetValue);
    }

    serializeXliff(document: Document): string {
        if (!this.activeParser) {
            const serializer = new XMLSerializer();
            return serializer.serializeToString(document);
        }
        return this.activeParser.serialize(document);
    }

    generateJson(units: TranslationUnit[]): string {
        const output: Record<string, string> = {};
        units.forEach(u => {
            output[u.id] = u.target;
        });
        return JSON.stringify(output, null, 2);
    }
}
