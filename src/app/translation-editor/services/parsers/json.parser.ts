import { TranslationUnit } from '../../models/translation-unit.model';
import { TranslationParser } from './translation-parser.interface';

export class JsonParser implements TranslationParser<Record<string, unknown>> {
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
        const json = JSON.parse(content) as Record<string, unknown>;
        const units: TranslationUnit[] = [];

        if (json['translations'] && typeof json['translations'] === 'object') {
            this.format = 'angular';
            this.flatten(json['translations'] as Record<string, unknown>, '', units);
        } else {
            // Check if it's flat or nested. If any value is an object, it's nested.
            const values = Object.values(json);
            const isNested = values.some(v => typeof v === 'object' && v !== null);
            this.format = isNested ? 'nested' : 'flat';
            this.flatten(json, '', units);
        }

        return {
            document: json,
            units,
            documentFormat: `json (${this.format})`,
            sourceLang: (json['locale'] as string) || undefined
        };
    }

    private flatten(obj: Record<string, unknown>, prefix: string, units: TranslationUnit[]) {
        for (const [key, value] of Object.entries(obj)) {
            const newKey = prefix ? `${prefix}.${key}` : key;
            if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                this.flatten(value as Record<string, unknown>, newKey, units);
            } else {
                units.push({
                    id: newKey,
                    source: '', // JSON has no source
                    target: String(value)
                });
            }
        }
    }

    updateUnit(document: Record<string, unknown>, id: string, targetValue: string): void {
        let current: any = document;

        if (this.format === 'angular' && document['translations']) {
            current = document['translations'];
        }

        if (this.format === 'nested') {
            const keys = id.split('.');
            for (let i = 0; i < keys.length - 1; i++) {
                const key = keys[i];
                if (!current[key] || typeof current[key] !== 'object') {
                    current[key] = {};
                }
                current = current[key];
            }
            current[keys[keys.length - 1]] = targetValue;
        } else {
            current[id] = targetValue;
        }
    }

    serialize(document: Record<string, unknown>): string {
        return JSON.stringify(document, null, 2);
    }

    getFeatures() {
        return {
            hasSource: false,
            hasNotes: false
        };
    }
}
