import { Injectable } from '@angular/core';
import { TranslationUnit } from '../models/translation-unit.model';

@Injectable({
    providedIn: 'root'
})
export class XliffParserService {

    parse(xmlContent: string): { document: Document; units: TranslationUnit[] } {
        const parser = new DOMParser();
        const document = parser.parseFromString(xmlContent, 'text/xml');

        // Check for parse errors
        const parserError = document.querySelector('parsererror');
        if (parserError) {
            throw new Error('Failed to parse XML');
        }

        const units: TranslationUnit[] = [];
        const transUnits = document.querySelectorAll('trans-unit');

        transUnits.forEach((node) => {
            const id = node.getAttribute('id') || '';
            const sourceNode = node.querySelector('source');
            const targetNode = node.querySelector('target');
            const noteNode = node.querySelector('note');

            const source = sourceNode?.textContent || '';
            // If target node doesn't exist, it might be untranslated. 
            // Some XLIFF files omit target if it's new. We can treat it as empty or fallback to source depending on reqs.
            // For editing, we usually want to see empty or existing.
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

        return { document, units };
    }

    updateUnit(document: Document, id: string, targetValue: string): void {
        // Find the trans-unit by id
        // querySelector might fail with special characters in ID, so detailed search or escaping needed
        // XLIFF IDs are often simple tokens but can be anything.
        // CSS selector escaping: CSS.escape(id) - but CSS.escape is browser only.
        // It is safer to iterate or use XPath if ids are complex, but for now simple selector:

        // We can't rely on getElementById because it requires DTD/Schema to define ID attributes.
        // So we use querySelector with attribute selector.
        // We need to handle quotes in ID if we use selectors. 
        // Safest is to iterate if we want to be 100% robust or just use selector carefully.

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
                // Create target node if missing
                // Must use correct namespace if document has one
                const namespace = document.documentElement.namespaceURI;
                if (namespace) {
                    targetNode = document.createElementNS(namespace, 'target');
                } else {
                    targetNode = document.createElement('target');
                }

                // Insert it after source? Or at end of unit?
                const sourceNode = unitNode.querySelector('source');
                if (sourceNode && sourceNode.nextSibling) {
                    unitNode.insertBefore(targetNode, sourceNode.nextSibling);
                } else {
                    unitNode.appendChild(targetNode);
                }
            }
            targetNode.textContent = targetValue;

            // Update state if we want to track "translated" automatically? 
            // User didn't strictly request state management updates in XML, but usually "translated" is good.
            // Let's leave state management manual or simple for now.
        }
    }

    serializeXliff(document: Document): string {
        const serializer = new XMLSerializer();
        return serializer.serializeToString(document);
    }

    generateJson(units: TranslationUnit[]): string {
        const output: Record<string, string> = {};
        units.forEach(u => {
            output[u.id] = u.target;
        });
        return JSON.stringify(output, null, 2);
    }
}
