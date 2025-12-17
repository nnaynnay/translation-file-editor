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
    <div class="container mx-auto px-4 py-8 bg-background text-foreground min-h-screen">
      <header class="mb-8 flex justify-between items-center border-b pb-6">
        <div>
          <h1 class="text-3xl font-bold tracking-tight text-foreground">XLIFF Editor</h1>
          @if (fileName()) {
            <p class="text-sm text-muted-foreground mt-1">Editing: {{ fileName() }}</p>
          }
        </div>
        
        @if (fileName()) {
          <div class="flex gap-2">
             <button 
              (click)="exportFile('xliff')"
              class="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
            >
              Export XLIFF
            </button>
            <button 
              (click)="exportFile('json')"
              class="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
            >
              Export JSON
            </button>
            <button 
              (click)="reset()"
              class="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-destructive hover:text-destructive-foreground h-10 px-4 py-2"
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
          <div class="mb-6 space-y-4">
            <div class="flex gap-4 items-center">
              <div class="flex-1 relative">
                <div class="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none">
                    <svg class="w-4 h-4 text-muted-foreground" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20">
                        <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z"/>
                    </svg>
                </div>
                <input 
                  type="text" 
                  [value]="filterQuery()"
                  (input)="onFilterChange($event)"
                  class="flex h-10 w-full rounded-md border border-input bg-background px-3 ps-10 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" 
                  placeholder="Search translations..." 
                />
              </div>
              <div class="flex items-center gap-4 text-sm text-muted-foreground">
                <div class="flex items-center gap-2">
                  <div class="h-2 w-2 rounded-full bg-primary/20"></div>
                  <span>Total: <span class="font-medium text-foreground">{{ stats().total }}</span></span>
                </div>
                <div class="flex items-center gap-2">
                  <div class="h-2 w-2 rounded-full bg-green-500"></div>
                  <span>Translated: <span class="font-medium text-foreground">{{ stats().translated }}</span></span>
                </div>
                <div class="flex items-center gap-2">
                  <div class="h-2 w-2 rounded-full bg-orange-500"></div>
                  <span>Missing: <span class="font-medium text-foreground">{{ stats().missing }}</span></span>
                </div>
              </div>
            </div>
          </div>

          <div class="rounded-md border">
            <app-translation-table 
              [units]="paginatedUnits()"
              [total]="totalItems()"
              [pageIndex]="pageIndex()"
              [pageSize]="pageSize()"
              (pageChange)="pageIndex.set($event)"
              (unitUpdate)="onUnitUpdate($event)"
            />
          </div>
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
