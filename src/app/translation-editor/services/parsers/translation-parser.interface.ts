import { TranslationUnit } from '../../models/translation-unit.model';

export interface TranslationParser {
    canParse(content: string): boolean;
    parse(content: string): { document: Document; units: TranslationUnit[] };
    updateUnit(document: Document, id: string, targetValue: string): void;
    serialize(document: Document): string;
}
