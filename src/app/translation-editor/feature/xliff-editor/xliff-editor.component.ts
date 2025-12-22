import { Component, computed, inject, signal, effect, viewChild, ElementRef } from '@angular/core';
import { XliffStateService } from '../../services/xliff-state.service';
import { FileUploadComponent } from '../../ui/file-upload/file-upload.component';
import { TranslationTableComponent } from '../../ui/translation-table/translation-table.component';
import { TranslationDetailComponent } from '../../ui/translation-detail/translation-detail.component';
import { DOCUMENT, DecimalPipe } from '@angular/common';

@Component({
  selector: 'app-xliff-editor',
  standalone: true,
  imports: [FileUploadComponent, TranslationTableComponent, TranslationDetailComponent, DecimalPipe],
  template: `
    <div class="flex flex-col h-screen bg-background text-foreground overflow-hidden">
      <!-- Header -->
      <header class="flex-none border-b px-6 py-4 flex justify-between items-center bg-background z-10">
        <div class="flex items-center gap-4">
          <img src="./assets/language.svg" alt="Language" class="w-6 h-6">  
          <div class="flex flex-col gap-0">
            <h1 class="text-2xl font-bold tracking-tight text-foreground">Translation File Editor</h1>
            <p class="text-sm text-muted-foreground">A simple editor for XLIFF 1.2, XLIFF 2, and JSON</p>         
          </div>
        </div>
        
        @if (fileName()) {
          <div class="flex gap-2">
             <button 
              (click)="exportFile('xliff')"
              class="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 py-2"
            >
              Export
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
             
             <!-- Summary Section -->
             <div class="flex-none px-6 pt-4 pb-2 border-b">
                <div class="flex items-center justify-between mb-4">
                  <div class="flex items-center gap-4">
                     <div class="p-2 bg-primary/10 rounded-lg">
                        <img src="./assets/language.svg" alt="File" class="w-6 h-6 text-primary">
                     </div>
                     <div>
                        <h2 class="text-base font-semibold tracking-tight leading-none">{{ fileName() }}</h2>
                        <div class="flex items-center gap-2 text-xs text-muted-foreground mt-1.5">
                           <span class="uppercase font-mono bg-muted px-1.5 py-0.5 rounded text-[10px] tracking-wider font-medium">XLIFF</span>
                           <span>{{ sourceLang() || '?' }}</span>
                           <span class="text-[10px]">➜</span>
                           <span>{{ targetLang() || '?' }}</span>
                        </div>
                     </div>
                  </div>

                  <div class="flex items-center gap-8">
                     <!-- Stats Grid -->
                     <div class="flex gap-6 text-sm">
                        <div class="flex flex-col items-center">
                           <span class="text-muted-foreground text-[10px] uppercase font-bold tracking-wider mb-0.5">Total</span>
                           <span class="font-bold text-foreground">{{ stats().total }}</span>
                        </div>
                        <div class="flex flex-col items-center">
                           <span class="text-muted-foreground text-[10px] uppercase font-bold tracking-wider mb-0.5">Translated</span>
                           <span class="font-bold text-green-600 dark:text-green-400">{{ stats().translated }}</span>
                        </div>
                        <div class="flex flex-col items-center">
                           <span class="text-muted-foreground text-[10px] uppercase font-bold tracking-wider mb-0.5">Missing</span>
                           <span class="font-bold text-orange-600 dark:text-orange-400">{{ stats().missing }}</span>
                        </div>
                        <div class="flex flex-col items-center">
                           <span class="text-muted-foreground text-[10px] uppercase font-bold tracking-wider mb-0.5">Changed</span>
                           <span class="font-bold text-blue-600 dark:text-blue-400">{{ stats().changed }}</span>
                        </div>
                     </div>
                     
                     <!-- Progress donut or simple percentage? Let's stick to bar for compactness but maybe put it below? 
                          Or keeping the large percentage? User said "more compact". 
                          Let's try a compact side block for progress. 
                     -->
                     <div class="flex flex-col items-end min-w-[100px]">
                        <div class="flex items-baseline gap-1 mb-1">
                           <span class="text-2xl font-bold tracking-tight">{{ (stats().translated / stats().total) * 100 | number:'1.0-0' }}</span>
                           <span class="text-sm font-medium text-muted-foreground">%</span>
                        </div>
                        <div class="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                           <div 
                              class="h-full bg-primary transition-all duration-500 ease-out"
                              [style.width.%]="(stats().translated / stats().total) * 100"
                           ></div>
                        </div>
                     </div>
                  </div>
                </div>
             </div>

             <!-- Toolbar -->
             <div class="flex-none p-4 flex items-center justify-between gap-4">
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

                <!-- Right Toolbar Actions -->
                <div class="flex items-center gap-4">
                  <!-- View Toggle -->
                  <div class="flex items-center rounded-md border bg-muted p-1 h-9">
                    <button
                      (click)="viewMode.set('compact')"
                      [class.bg-background]="viewMode() === 'compact'"
                      [class.shadow-sm]="viewMode() === 'compact'"
                      [class.text-foreground]="viewMode() === 'compact'"
                      [class.text-muted-foreground]="viewMode() !== 'compact'"
                      class="inline-flex items-center justify-center rounded-sm px-2.5 py-1 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-full"
                      title="Compact View"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12h18"/><path d="M3 6h18"/><path d="M3 18h18"/></svg>
                    </button>
                    <button
                      (click)="viewMode.set('spacious')"
                      [class.bg-background]="viewMode() === 'spacious'"
                      [class.shadow-sm]="viewMode() === 'spacious'"
                      [class.text-foreground]="viewMode() === 'spacious'"
                      [class.text-muted-foreground]="viewMode() !== 'spacious'"
                      class="inline-flex items-center justify-center rounded-sm px-2.5 py-1 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-full"
                      title="Spacious View"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M3 12h18"/><path d="M3 18h18"/><rect width="18" height="18" x="3" y="3" rx="2"/></svg>
                    </button>
                  </div>

                  <!-- Filter Dropdown -->
                  <div class="flex items-center gap-2 relative">
                    <span class="text-sm font-medium text-muted-foreground">Show</span>
                  
                  <!-- Backdrop -->
                  @if (dropdownOpen()) {
                    <div class="fixed inset-0 z-30" (click)="closeDropdown()"></div>
                  }

                  <div class="relative z-40">
                    <button 
                      (click)="toggleDropdown()"
                      class="flex h-9 w-[200px] items-center justify-between rounded-md border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <span class="truncate">
                        @switch (filterStatus()) {
                          @case ('all') { Total ({{ stats().total }}) }
                          @case ('translated') { Translated ({{ stats().translated }}) }
                          @case ('missing') { Missing ({{ stats().missing }}) }
                          @case ('changed') { Changed ({{ stats().changed }}) }
                        }
                      </span>
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4 opacity-50"><path d="m6 9 6 6 6-6"/></svg>
                    </button>

                    @if (dropdownOpen()) {
                      <div class="absolute right-0 top-full mt-1 w-[200px] rounded-md border bg-popover text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2">
                        <div class="p-1">
                          <button
                            (click)="setFilter('all')"
                            class="relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                            [class.bg-accent]="filterStatus() === 'all'"
                          >
                           Total ({{ stats().total }})
                          </button>
                          <button
                            (click)="setFilter('translated')"
                            class="relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                            [class.bg-accent]="filterStatus() === 'translated'"
                          >
                           Translated ({{ stats().translated }})
                          </button>
                          <button
                            (click)="setFilter('missing')"
                            class="relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                            [class.bg-accent]="filterStatus() === 'missing'"
                          >
                           Missing ({{ stats().missing }})
                          </button>
                          <button
                            (click)="setFilter('changed')"
                            class="relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                            [class.bg-accent]="filterStatus() === 'changed'"
                          >
                           Changed ({{ stats().changed }})
                          </button>
                        </div>
                      </div>
                    }
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
                  [viewMode]="viewMode()"
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
  sourceLang = this.state.sourceLang;
  targetLang = this.state.targetLang;
  filterQuery = this.state.filterQuery;
  filterStatus = this.state.filterStatus;
  stats = this.state.totalStats;

  pageIndex = signal(0);
  pageSize = signal(10);
  selectedUnitId = signal<string | null>(null);
  dropdownOpen = signal(false);
  viewMode = signal<'compact' | 'spacious'>('spacious');

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

  toggleDropdown() {
    this.dropdownOpen.update(v => !v);
  }

  closeDropdown() {
    this.dropdownOpen.set(false);
  }

  setFilter(status: 'all' | 'translated' | 'missing' | 'changed') {
    this.state.filterStatus.set(status);
    this.pageIndex.set(0);
    this.selectedUnitId.set(null);
    this.closeDropdown();
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
