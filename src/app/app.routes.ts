import { Routes } from '@angular/router';

export const routes: Routes = [
    {
        path: '',
        loadComponent: () => import('./l10n/feature/xliff-editor/xliff-editor.component').then(m => m.XliffEditorComponent)
    }
];
