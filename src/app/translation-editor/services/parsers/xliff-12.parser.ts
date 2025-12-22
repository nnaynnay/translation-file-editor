import { TranslationUnit } from '../../models/translation-unit.model';
import { TranslationParser } from './translation-parser.interface';

export class Xliff12Parser implements TranslationParser {
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
            const noteNode = node.querySelector('note');

            const source = sourceNode?.textContent || '';
            const target = targetNode?.textContent || '';
            const note = noteNode?.textContent || undefined;
            const state = targetNode?.getAttribute('state') || undefined;

            units.push({
                id,
                source,
                target,
                note,
                state
            });
        });

        return { document, units, sourceLang, targetLang, documentFormat: 'xliff 1.2' };
    }

    updateUnit(document: Document, id: string, targetValue: string): void {
        const transUnits = document.getElementsByTagName('trans-unit');
        let unitNode: Element | null = null;

        for (let i = 0; i < transUnits.length; i++) {
            if (transUnits[i].getAttribute('id') === id) {
                unitNode = transUnits[i];
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
}
