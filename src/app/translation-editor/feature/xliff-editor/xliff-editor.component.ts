import { Component, computed, inject, signal } from '@angular/core';
import { XliffStateService } from '../../services/xliff-state.service';
import { FileUploadComponent } from '../../ui/file-upload/file-upload.component';
import { TranslationTableComponent } from '../../ui/translation-table/translation-table.component';
import { TranslationDetailComponent } from '../../ui/translation-detail/translation-detail.component';
import { DOCUMENT } from '@angular/common';

@Component({
  selector: 'app-xliff-editor',
  standalone: true,
  imports: [FileUploadComponent, TranslationTableComponent, TranslationDetailComponent],
  template: `
    <div class="flex flex-col h-screen bg-background text-foreground overflow-hidden">
      <!-- Header -->
      <header class="flex-none border-b px-6 py-4 flex justify-between items-center bg-background z-10">
        <div>
          <h1 class="text-2xl font-bold tracking-tight text-foreground">XLIFF Editor</h1>
          @if (fileName()) {
            <p class="text-sm text-muted-foreground mt-1">Editing: {{ fileName() }}</p>
          }
        </div>
        
        @if (fileName()) {
          <div class="flex gap-2">
             <button 
              (click)="exportFile('xliff')"
              class="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 py-2"
            >
              Export XLIFF
            </button>
            <button 
              (click)="exportFile('json')"
              class="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2"
            >
              Export JSON
            </button>
            <button 
              (click)="reset()"
              class="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-destructive hover:text-destructive-foreground h-9 px-4 py-2"
            >
              Close
            </button>
          </div>
        }
      </header>

      <!-- Main Content Area -->
      <div class="flex-1 flex overflow-hidden">
        @if (!fileName()) {
          <main class="flex-1 p-6 overflow-auto">
             <app-file-upload (fileSelected)="onFileSelected($event)" />
          </main>
        } @else {
          <!-- Left Pane: Table & Toolbar -->
          <div class="flex-1 flex flex-col min-w-0">
             <!-- Toolbar -->
             <div class="flex-none p-4 border-b">
                <div class="flex gap-4 items-center max-w-4xl">
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
                      class="flex h-9 w-full rounded-md border border-input bg-background px-3 ps-10 py-1 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" 
                      placeholder="Search translations..." 
                    />
                  </div>
                  <div class="flex items-center gap-4 text-sm text-muted-foreground whitespace-nowrap">
                    <div class="flex items-center gap-2">
                      <div class="h-2 w-2 rounded-full bg-primary/20"></div>
                      <span>Total: <span class="font-medium text-foreground">{{ stats().total }}</span></span>
                    </div>
                    <div class="flex items-center gap-2">
                      <div class="h-2 w-2 rounded-full bg-green-500"></div>
                      <span>{{ stats().translated }}</span>
                    </div>
                    <div class="flex items-center gap-2">
                      <div class="h-2 w-2 rounded-full bg-orange-500"></div>
                      <span>{{ stats().missing }}</span>
                    </div>
                  </div>
                </div>
             </div>

             <!-- Table Scroller -->
             <div class="flex-1 overflow-auto p-4">
               <div class="rounded-md border">
                <app-translation-table 
                  [units]="paginatedUnits()"
                  [total]="totalItems()"
                  [pageIndex]="pageIndex()"
                  [pageSize]="pageSize()"
                  [selectedId]="selectedUnitId()"
                  (pageChange)="pageIndex.set($event)"
                  (unitSelect)="selectUnit($event)"
                />
               </div>
             </div>
          </div>

          <!-- Right Pane: Detail View -->
          @if (selectedUnit()) {
            <aside class="w-[400px] flex-none shadow-xl z-20">
              <app-translation-detail 
                [unit]="selectedUnit()!"
                (save)="onUnitUpdate($event)"
                (close)="selectedUnitId.set(null)"
              />
            </aside>
          }
        }
      </div>
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
  selectedUnitId = signal<string | null>(null);

  // Pagination Logic
  paginatedUnits = computed(() => {
    const all = this.state.filteredUnits();
    const start = this.pageIndex() * this.pageSize();
    return all.slice(start, start + this.pageSize());
  });

  totalItems = computed(() => this.state.filteredUnits().length);

  selectedUnit = computed(() => {
    const id = this.selectedUnitId();
    if (!id) return null;
    return this.state.units().find(u => u.id === id) || null;
  });

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
    this.selectedUnitId.set(null); // Clear selection on filter change
  }

  selectUnit(id: string) {
    this.selectedUnitId.set(id);
  }

  onUnitUpdate(event: { id: string, target: string }) {
    this.state.updateTranslation(event.id, event.target);
  }

  reset() {
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
