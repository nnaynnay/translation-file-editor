import { Routes } from '@angular/router';

export const routes: Routes = [
    {
        path: '',
        loadComponent: () => import('./translation-editor/feature/xliff-editor/xliff-editor.component').then(m => m.XliffEditorComponent)
    },
    {
        path: 'sample-i18n',
        loadComponent: () => import('./translation-editor/feature/sample-i18n/sample-i18n.component').then(m => m.SampleI18nComponent)
    }
];
