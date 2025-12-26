import { JsonParser } from './json.parser';
import { AngularJsonFormat, JsonTranslationMap } from './translation-parser.interface';

describe('JsonParser', () => {
    let parser: JsonParser;

    beforeEach(() => {
        parser = new JsonParser();
    });

    it('should detect flat format', () => {
        const content = JSON.stringify({ "a.b": "v1", "c": "v2" });
        const result = parser.parse(content);
        expect(result.documentFormat).toBe('json (flat)');
        expect(result.units.length).toBe(2);
        expect(result.units[0].id).toBe('a.b');
    });

    it('should detect nested format', () => {
        const content = JSON.stringify({ "a": { "b": "v1" }, "c": "v2" });
        const result = parser.parse(content);
        expect(result.documentFormat).toBe('json (nested)');
        expect(result.units.length).toBe(2);
        expect(result.units[0].id).toBe('a.b');
    });

    it('should detect angular format', () => {
        const content = JSON.stringify({ "translations": { "a.b": "v1" } });
        const result = parser.parse(content);
        expect(result.documentFormat).toBe('json (angular)');
        expect(result.units.length).toBe(1);
        expect(result.units[0].id).toBe('a.b');
    });

    it('should update unit in flat format without splitting dots', () => {
        const content = JSON.stringify({ "a.b": "v1" });
        const { document } = parser.parse(content);
        parser.updateUnit(document, 'a.b', 'new');
        const map = document as JsonTranslationMap;
        expect(map['a.b']).toBe('new');
        expect(map['a']).toBeUndefined();
    });

    it('should update unit in nested format with splitting dots', () => {
        const content = JSON.stringify({ "a": { "b": "v1" } });
        const { document } = parser.parse(content);
        parser.updateUnit(document, 'a.b', 'new');
        const map = document as JsonTranslationMap;
        const a = map['a'] as JsonTranslationMap;
        expect(a['b']).toBe('new');
    });

    it('should update unit in angular format without splitting dots', () => {
        const content = JSON.stringify({ "translations": { "a.b": "v1" } });
        const { document } = parser.parse(content);
        parser.updateUnit(document, 'a.b', 'new');
        const angular = document as AngularJsonFormat;
        expect(angular.translations['a.b']).toBe('new');
        expect(angular.translations['a']).toBeUndefined();
    });
});
