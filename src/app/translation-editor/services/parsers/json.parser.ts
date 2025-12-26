import { TranslationUnit } from '../../models/translation-unit.model';
import { AngularJsonFormat, ExportFormat, JsonTranslationMap, TranslationParser } from './translation-parser.interface';

export class JsonParser implements TranslationParser<JsonTranslationMap | AngularJsonFormat> {
    private format: 'flat' | 'nested' | 'angular' = 'flat';

    canParse(content: string): boolean {
        try {
            const json = JSON.parse(content);
            return typeof json === 'object' && json !== null;
        } catch {
            return false;
        }
    }

    parse(content: string) {
        const json = JSON.parse(content) as JsonTranslationMap | AngularJsonFormat;
        const units: TranslationUnit[] = [];

        if ('translations' in json && typeof json.translations === 'object') {
            this.format = 'angular';
            this.flatten(json.translations, '', units);
        } else {
            const map = json as JsonTranslationMap;
            // Check if it's flat or nested. If any value is an object, it's nested.
            const values = Object.values(map);
            const isNested = values.some(v => typeof v === 'object' && v !== null);
            this.format = isNested ? 'nested' : 'flat';
            this.flatten(map, '', units);
        }

        return {
            document: json,
            units,
            documentFormat: `json (${this.format})`,
            targetLang: ('locale' in json ? (json.locale as string) : undefined)
        };
    }

    private flatten(obj: JsonTranslationMap, prefix: string, units: TranslationUnit[]) {
        for (const [key, value] of Object.entries(obj)) {
            const newKey = prefix ? `${prefix}.${key}` : key;
            if (typeof value === 'object' && value !== null) {
                this.flatten(value, newKey, units);
            } else {
                units.push({
                    id: newKey,
                    source: '', // JSON has no source
                    target: String(value)
                });
            }
        }
    }

    updateUnit(document: JsonTranslationMap | AngularJsonFormat, id: string, targetValue: string): void {
        const currentMap = ('translations' in document && typeof document.translations === 'object')
            ? document.translations
            : document as JsonTranslationMap;

        if (this.format === 'nested') {
            const keys = id.split('.');
            let tip = currentMap;
            for (let i = 0; i < keys.length - 1; i++) {
                const key = keys[i];
                if (!tip[key] || typeof tip[key] !== 'object') {
                    tip[key] = {};
                }
                tip = tip[key] as JsonTranslationMap;
            }
            tip[keys[keys.length - 1]] = targetValue;
        } else {
            currentMap[id] = targetValue;
        }
    }

    serialize(document: JsonTranslationMap | AngularJsonFormat): string {
        return JSON.stringify(document, null, 2);
    }

    getFeatures() {
        return {
            hasSource: false,
            hasNotes: false
        };
    }

    getSupportedExportFormats(): ExportFormat[] {
        if (this.format === 'nested') {
            return [
                { type: 'json', jsonFormat: 'nested' },
                { type: 'json', jsonFormat: 'flat' }
            ];
        }
        if (this.format === 'angular') {
            return [{ type: 'json', jsonFormat: 'angular' }];
        }
        return [{ type: 'json', jsonFormat: 'flat' }];
    }
}
