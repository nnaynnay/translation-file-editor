import { TranslationUnit } from '../../models/translation-unit.model';
import { ExportFormat, TranslationParser } from './translation-parser.interface';

export class Xliff2Parser implements TranslationParser<Document> {
    canParse(content: string): boolean {
        return content.includes('version="2.0"') && content.includes('presentation="libRExo"'); // Basic check, can be more robust
    }

    parse(xmlContent: string) {
        const parser = new DOMParser();
        const document = parser.parseFromString(xmlContent, 'text/xml');

        const parserError = document.querySelector('parsererror');
        if (parserError) {
            throw new Error('Failed to parse XML');
        }

        const units: TranslationUnit[] = [];
        const unitNodes = document.querySelectorAll('unit');

        const xliffNode = document.querySelector('xliff');
        const sourceLang = xliffNode?.getAttribute('srcLang') || undefined;
        const targetLang = xliffNode?.getAttribute('trgLang') || undefined;

        unitNodes.forEach((node) => {
            const id = node.getAttribute('id') || '';
            const segment = node.querySelector('segment');
            const sourceNode = segment?.querySelector('source');
            const targetNode = segment?.querySelector('target');

            const source = sourceNode?.textContent || '';
            const target = targetNode?.textContent || '';
            const state = segment?.getAttribute('state') || undefined;

            const notes: TranslationUnit['notes'] = [];
            const noteNodes = node.querySelectorAll('notes note');
            noteNodes.forEach(nn => {
                const category = nn.getAttribute('category');
                if (category === 'location') {
                    notes.push({
                        type: 'location',
                        content: nn.textContent || '',
                        category: 'location'
                    });
                } else {
                    notes.push({
                        type: 'note',
                        content: nn.textContent || '',
                        category: category || undefined
                    });
                }
            });

            units.push({
                id,
                source,
                target,
                notes: notes.length > 0 ? notes : undefined,
                state
            });
        });

        return { document, units, sourceLang, targetLang, documentFormat: 'xliff 2.0' };
    }

    updateUnit(document: Document, id: string, targetValue: string): void {
        const units = document.querySelectorAll('unit');
        let unitNode: Element | null = null;

        // XLIFF 2.0 IDs are unique within a file, but let's just search globally for now
        for (const unit of units) {
            if (unit.getAttribute('id') === id) {
                unitNode = unit;
                break;
            }
        }

        if (unitNode) {
            const segment = unitNode.querySelector('segment');
            if (!segment) {
                // Should verify XLIFF 2.0 spec if we can create segments dynamically, but usually they key off source
                console.warn('Segment not found for unit', id);
                return;
            }

            let targetNode = segment.querySelector('target');
            if (!targetNode) {
                const namespace = document.documentElement.namespaceURI;
                if (namespace) {
                    targetNode = document.createElementNS(namespace, 'target');
                } else {
                    targetNode = document.createElement('target');
                }

                const sourceNode = segment.querySelector('source');
                if (sourceNode && sourceNode.nextSibling) {
                    segment.insertBefore(targetNode, sourceNode.nextSibling);
                } else {
                    segment.appendChild(targetNode);
                }
            }
            targetNode.textContent = targetValue;
        }
    }

    serialize(document: Document): string {
        const serializer = new XMLSerializer();
        return serializer.serializeToString(document);
    }

    getFeatures() {
        return {
            hasSource: true,
            hasNotes: true
        };
    }

    getSupportedExportFormats(): ExportFormat[] {
        return [{ type: 'xliff' }];
    }
}
