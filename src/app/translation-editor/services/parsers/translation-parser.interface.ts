import { TranslationUnit } from '../../models/translation-unit.model';

export interface JsonTranslationMap {
    [key: string]: string | JsonTranslationMap;
}

export interface AngularJsonFormat {
    locale: string;
    translations: JsonTranslationMap;
}

export type TranslationDocument = Document | JsonTranslationMap | AngularJsonFormat;

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
