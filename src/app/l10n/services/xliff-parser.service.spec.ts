import { TestBed } from '@angular/core/testing';
import { XliffParserService } from './xliff-parser.service';

const SAMPLE_XLIFF = `<?xml version="1.0" encoding="UTF-8"?>
<xliff version="1.2" xmlns="urn:oasis:names:tc:xliff:document:1.2">
  <file source-language="en" target-language="zh-Hant" datatype="plaintext" original="sample-app-strings">
    <body>
      <trans-unit id="welcome.title" resname="welcome.title">
        <source>Welcome to our app</source>
        <target>歡迎使用我們的應用程式</target>
        <note from="developer">Main welcome screen title.</note>
      </trans-unit>
      <trans-unit id="welcome.subtitle">
        <source>Get started in seconds.</source>
      </trans-unit>
    </body>
  </file>
</xliff>`;

describe('XliffParserService', () => {
    let service: XliffParserService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(XliffParserService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should parse xliff content', () => {
        const { document, units } = service.parse(SAMPLE_XLIFF);
        expect(document).toBeTruthy();
        expect(units.length).toBe(2);

        expect(units[0].id).toBe('welcome.title');
        expect(units[0].source).toBe('Welcome to our app');
        expect(units[0].target).toBe('歡迎使用我們的應用程式');
        expect(units[0].note).toBe('Main welcome screen title.');

        expect(units[1].id).toBe('welcome.subtitle');
        expect(units[1].target).toBe('');
    });

    it('should update unit', () => {
        const { document, units } = service.parse(SAMPLE_XLIFF);
        service.updateUnit(document, 'welcome.title', 'New Target');

        // Check serialization
        const xml = service.serializeXliff(document);
        expect(xml).toContain('<target>New Target</target>');

        // Check update on missing target
        service.updateUnit(document, 'welcome.subtitle', 'Subtitle Target');
        const xml2 = service.serializeXliff(document);
        expect(xml2).toContain('<target>Subtitle Target</target>');
    });

    it('should generate json', () => {
        const { units } = service.parse(SAMPLE_XLIFF);
        const json = service.generateJson(units);
        const parsed = JSON.parse(json);

        expect(parsed['welcome.title']).toBe('歡迎使用我們的應用程式');
        expect(parsed['welcome.subtitle']).toBe('');
    });
});
