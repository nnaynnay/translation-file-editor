import { Component, computed, inject, signal, effect, viewChild, ElementRef } from '@angular/core';
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
          <h1 class="text-2xl font-bold tracking-tight text-foreground">Translation File Editor</h1>
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
             <div class="flex-none p-4 border-b flex items-center justify-between gap-4">
                <!-- Search -->
                <div class="relative w-72">
                  <div class="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none">
                      <svg class="w-4 h-4 text-muted-foreground" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20">
                          <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z"/>
                      </svg>
                  </div>
                  <input 
                    #searchInput
                    type="text" 
                    [value]="filterQuery()"
                    (input)="onSearchInput($event)"
                    (keydown.escape)="searchInput.blur()"
                    class="flex h-9 w-full rounded-md border border-input bg-background px-3 ps-10 py-1 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 pr-10" 
                    placeholder="Search..." 
                  />
                  <kbd class="pointer-events-none absolute right-1.5 top-1.5 hidden h-6 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100 sm:flex">
                    <span class="text-xs">⌘</span>K
                  </kbd>
                </div>

                <!-- Tabs -->
                <div class="flex space-x-1 rounded-lg bg-muted p-1">
                  <button
                    (click)="setFilter('all')"
                    [class.bg-background]="filterStatus() === 'all'"
                    [class.shadow-sm]="filterStatus() === 'all'"
                    class="inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 text-foreground"
                  >
                    Total <span class="ml-2 px-1.5 py-0.5 text-xs rounded-full bg-muted-foreground/20">{{ stats().total }}</span>
                  </button>
                  <button
                    (click)="setFilter('translated')"
                    [class.bg-background]="filterStatus() === 'translated'"
                    [class.shadow-sm]="filterStatus() === 'translated'"
                    class="inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 text-foreground"
                  >
                    Translated <span class="ml-2 px-1.5 py-0.5 text-xs rounded-full bg-green-500/20 text-green-700 dark:text-green-400">{{ stats().translated }}</span>
                  </button>
                  <button
                    (click)="setFilter('missing')"
                    [class.bg-background]="filterStatus() === 'missing'"
                    [class.shadow-sm]="filterStatus() === 'missing'"
                    class="inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 text-foreground"
                  >
                    Missing <span class="ml-2 px-1.5 py-0.5 text-xs rounded-full bg-orange-500/20 text-orange-700 dark:text-orange-400">{{ stats().missing }}</span>
                  </button>
                  <button
                    (click)="setFilter('changed')"
                    [class.bg-background]="filterStatus() === 'changed'"
                    [class.shadow-sm]="filterStatus() === 'changed'"
                    class="inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 text-foreground"
                  >
                    Changed <span class="ml-2 px-1.5 py-0.5 text-xs rounded-full bg-blue-500/20 text-blue-700 dark:text-blue-400">{{ stats().changed }}</span>
                  </button>
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

  searchInput = viewChild<ElementRef<HTMLInputElement>>('searchInput');

  fileName = this.state.fileName;
  filterQuery = this.state.filterQuery;
  filterStatus = this.state.filterStatus;
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
    // Legacy method - remove or keep empty if needed by template reference?
    // Template now uses onSearchInput
  }


  constructor() {
    effect((onCleanup) => {
      const handleKeydown = (e: KeyboardEvent) => {
        if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
          e.preventDefault();
          this.searchInput()?.nativeElement.focus();
        }
      };
      document.addEventListener('keydown', handleKeydown);
      onCleanup(() => document.removeEventListener('keydown', handleKeydown));
    });
  }

  onSearchInput(event: Event) {
    const val = (event.target as HTMLInputElement).value;
    this.state.filterQuery.set(val);
    this.pageIndex.set(0);
    this.selectedUnitId.set(null);
  }

  setFilter(status: 'all' | 'translated' | 'missing' | 'changed') {
    this.state.filterStatus.set(status);
    this.pageIndex.set(0);
    this.selectedUnitId.set(null);
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
