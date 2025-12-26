import { TranslationUnit } from '../../models/translation-unit.model';
import { ExportFormat, TranslationParser } from './translation-parser.interface';

export class Xliff12Parser implements TranslationParser<Document> {
    canParse(content: string): boolean {
        return content.includes('urn:oasis:names:tc:xliff:document:1.2');
    }

    parse(xmlContent: string) {
        const parser = new DOMParser();
        const document = parser.parseFromString(xmlContent, 'text/xml');

        const parserError = document.querySelector('parsererror');
        if (parserError) {
            throw new Error('Failed to parse XML');
        }

        const units: TranslationUnit[] = [];
        const transUnits = document.querySelectorAll('trans-unit');

        const fileNode = document.querySelector('file');
        const sourceLang = fileNode?.getAttribute('source-language') || undefined;
        const targetLang = fileNode?.getAttribute('target-language') || undefined;

        transUnits.forEach((node) => {
            const id = node.getAttribute('id') || '';
            const sourceNode = node.querySelector('source');
            const targetNode = node.querySelector('target');

            const source = sourceNode?.textContent || '';
            const target = targetNode?.textContent || '';
            const state = targetNode?.getAttribute('state') || undefined;

            const notes: TranslationUnit['notes'] = [];

            // 1. Extract context-group (locations)
            const contextGroups = node.querySelectorAll('context-group[purpose="location"]');
            contextGroups.forEach(cg => {
                const sourcefile = cg.querySelector('context[context-type="sourcefile"]')?.textContent || '';
                const linenumber = cg.querySelector('context[context-type="linenumber"]')?.textContent || '';
                if (sourcefile) {
                    notes.push({
                        type: 'location',
                        content: `${sourcefile}${linenumber ? ':' + linenumber : ''} `,
                        sourcefile,
                        linenumber,
                        purpose: 'location'
                    });
                }
            });

            // 2. Extract notes
            const noteNodes = node.querySelectorAll('note');
            noteNodes.forEach(nn => {
                notes.push({
                    type: 'note',
                    content: nn.textContent || '',
                    from: nn.getAttribute('from') || undefined,
                    priority: Number(nn.getAttribute('priority')) || undefined
                });
            });

            units.push({
                id,
                source,
                target,
                notes: notes.length > 0 ? notes : undefined,
                state
            });
        });

        return { document, units, sourceLang, targetLang, documentFormat: 'xliff 1.2' };
    }

    updateUnit(document: Document, id: string, targetValue: string): void {
        const transUnits = document.getElementsByTagName('trans-unit');
        let unitNode: Element | null = null;

        for (const unit of transUnits) {
            if (unit.getAttribute('id') === id) {
                unitNode = unit;
                break;
            }
        }

        if (unitNode) {
            let targetNode = unitNode.querySelector('target');
            if (!targetNode) {
                const namespace = document.documentElement.namespaceURI;
                if (namespace) {
                    targetNode = document.createElementNS(namespace, 'target');
                } else {
                    targetNode = document.createElement('target');
                }

                const sourceNode = unitNode.querySelector('source');
                if (sourceNode && sourceNode.nextSibling) {
                    unitNode.insertBefore(targetNode, sourceNode.nextSibling);
                } else {
                    unitNode.appendChild(targetNode);
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
