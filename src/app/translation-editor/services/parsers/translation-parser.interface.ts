import { TranslationUnit } from '../../models/translation-unit.model';

export type TranslationDocument = Document | Record<string, unknown>;

export interface ParserFeatures {
    hasSource: boolean;
    hasNotes: boolean;
}

export type ExportFormat =
    | { type: 'xliff' }
    | { type: 'json', jsonFormat: 'flat' | 'nested' | 'angular' };

export interface TranslationParser<T extends TranslationDocument = TranslationDocument> {
    canParse(content: string): boolean;
    parse(content: string): { document: T; units: TranslationUnit[]; sourceLang?: string; targetLang?: string; documentFormat?: string };
    updateUnit(document: T, id: string, targetValue: string): void;
    serialize(document: T): string;
    getFeatures(): ParserFeatures;
    getSupportedExportFormats(): ExportFormat[];
}
