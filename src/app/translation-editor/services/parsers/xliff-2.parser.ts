import { TranslationUnit } from '../../models/translation-unit.model';
import { TranslationParser } from './translation-parser.interface';

export class Xliff2Parser implements TranslationParser {
    canParse(content: string): boolean {
        return content.includes('version="2.0"') && content.includes('presentation="libRExo"'); // Basic check, can be more robust
    }

    parse(xmlContent: string): { document: Document; units: TranslationUnit[] } {
        const parser = new DOMParser();
        const document = parser.parseFromString(xmlContent, 'text/xml');

        const parserError = document.querySelector('parsererror');
        if (parserError) {
            throw new Error('Failed to parse XML');
        }

        const units: TranslationUnit[] = [];
        const unitNodes = document.querySelectorAll('unit');

        unitNodes.forEach((node) => {
            const id = node.getAttribute('id') || '';
            const segment = node.querySelector('segment');
            const sourceNode = segment?.querySelector('source');
            const targetNode = segment?.querySelector('target');
            const noteNode = node.querySelector('notes note'); // XLIFF 2.0 structure for notes is different

            const source = sourceNode?.textContent || '';
            const target = targetNode?.textContent || '';
            const note = noteNode?.textContent || undefined;
            // XLIFF 2.0 state is usually on the segment or unit, simplistically checking unit or segment
            const state = segment?.getAttribute('state') || undefined;

            units.push({
                id,
                source,
                target,
                note,
                state
            });
        });

        return { document, units };
    }

    updateUnit(document: Document, id: string, targetValue: string): void {
        const units = document.querySelectorAll('unit');
        let unitNode: Element | null = null;

        // XLIFF 2.0 IDs are unique within a file, but let's just search globally for now
        for (let i = 0; i < units.length; i++) {
            if (units[i].getAttribute('id') === id) {
                unitNode = units[i];
                break;
            }
        }

        if (unitNode) {
            let segment = unitNode.querySelector('segment');
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
}
