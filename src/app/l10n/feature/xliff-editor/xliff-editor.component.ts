import { Component, computed, inject, signal } from '@angular/core';
import { XliffStateService } from '../../services/xliff-state.service';
import { FileUploadComponent } from '../../ui/file-upload/file-upload.component';
import { TranslationTableComponent } from '../../ui/translation-table/translation-table.component';
import { DOCUMENT } from '@angular/common';

@Component({
    selector: 'app-xliff-editor',
    standalone: true,
    imports: [FileUploadComponent, TranslationTableComponent],
    template: `
    <div class="container mx-auto px-4 py-8">
      <header class="mb-8 flex justify-between items-center">
        <div>
          <h1 class="text-3xl font-bold text-gray-900 dark:text-white">XLIFF Editor</h1>
          @if (fileName()) {
            <p class="text-sm text-gray-500 mt-1">Editing: {{ fileName() }}</p>
          }
        </div>
        
        @if (fileName()) {
          <div class="flex gap-2">
             <button 
              (click)="exportFile('xliff')"
              class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 dark:focus:ring-blue-900"
            >
              Export XLIFF
            </button>
            <button 
              (click)="exportFile('json')"
              class="px-4 py-2 text-sm font-medium text-gray-900 bg-white border border-gray-200 rounded-lg hover:bg-gray-100 hover:text-blue-700 focus:ring-4 focus:ring-gray-100 dark:focus:ring-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600 dark:hover:text-white dark:hover:bg-gray-700"
            >
              Export JSON
            </button>
            <button 
              (click)="reset()"
              class="px-4 py-2 text-sm font-medium text-red-600 bg-transparent border border-red-600 rounded-lg hover:bg-red-50 dark:text-red-500 dark:border-red-500 dark:hover:bg-gray-900"
            >
              Close
            </button>
          </div>
        }
      </header>

      <main>
        @if (!fileName()) {
          <app-file-upload (fileSelected)="onFileSelected($event)" />
        } @else {
          <div class="mb-6">
            <div class="flex gap-4 items-center">
              <div class="flex-1 relative">
                <div class="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none">
                    <svg class="w-4 h-4 text-gray-500 dark:text-gray-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20">
                        <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z"/>
                    </svg>
                </div>
                <input 
                  type="text" 
                  [value]="filterQuery()"
                  (input)="onFilterChange($event)"
                  class="block w-full p-4 ps-10 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" 
                  placeholder="Search translations..." 
                />
              </div>
              <div class="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                <span>Total: {{ stats().total }}</span>
                <span class="text-green-600 dark:text-green-400">Translated: {{ stats().translated }}</span>
                <span class="text-orange-600 dark:text-orange-400">Missing: {{ stats().missing }}</span>
              </div>
            </div>
          </div>

          <app-translation-table 
            [units]="paginatedUnits()"
            [total]="totalItems()"
            [pageIndex]="pageIndex()"
            [pageSize]="pageSize()"
            (pageChange)="pageIndex.set($event)"
            (unitUpdate)="onUnitUpdate($event)"
          />
        }
      </main>
    </div>
  `
})
export class XliffEditorComponent {
    private state = inject(XliffStateService);
    private document = inject(DOCUMENT);

    fileName = this.state.fileName;
    filterQuery = this.state.filterQuery;
    stats = this.state.totalStats;

    pageIndex = signal(0);
    pageSize = signal(10);

    // Pagination Logic
    paginatedUnits = computed(() => {
        const all = this.state.filteredUnits();
        const start = this.pageIndex() * this.pageSize();
        return all.slice(start, start + this.pageSize());
    });

    totalItems = computed(() => this.state.filteredUnits().length);

    async onFileSelected(file: File) {
        try {
            await this.state.loadFile(file);
            this.pageIndex.set(0);
        } catch (e) {
            console.error(e);
            alert('Failed to parse file');
        }
    }

    onFilterChange(event: Event) {
        const val = (event.target as HTMLInputElement).value;
        this.state.filterQuery.set(val);
        this.pageIndex.set(0); // Reset page on filter
    }

    onUnitUpdate(event: { id: string, target: string }) {
        this.state.updateTranslation(event.id, event.target);
    }

    reset() {
        // Ideally state service should have a reset method, but reloading works for MVP.
        // Or just clearing signals:
        // This is a quick way to "close" file.
        window.location.reload();
    }

    exportFile(format: 'xliff' | 'json') {
        const content = this.state.getExportContent(format);
        const blob = new Blob([content], { type: format === 'json' ? 'application/json' : 'application/xliff+xml' });
        const url = URL.createObjectURL(blob);

        const a = this.document.createElement('a');
        a.href = url;
        a.download = format === 'json' ? 'translations.json' : `translated_${this.fileName()}`;
        a.click();
        URL.revokeObjectURL(url);
    }
}
