import { Component, computed, inject, signal, effect, viewChild, ElementRef } from '@angular/core';
import { XliffStateService } from '../../services/xliff-state.service';
import { FileUploadComponent } from '../../ui/file-upload/file-upload.component';
import { TranslationTableComponent } from '../../ui/translation-table/translation-table.component';
import { TranslationDetailComponent } from '../../ui/translation-detail/translation-detail.component';
import { PaginationComponent } from '../../ui/pagination/pagination.component';
import { DOCUMENT, DecimalPipe } from '@angular/common';

@Component({
  selector: 'app-xliff-editor',
  standalone: true,
  imports: [FileUploadComponent, TranslationTableComponent, TranslationDetailComponent, DecimalPipe, PaginationComponent],
  templateUrl: './xliff-editor.component.html',
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
  documentFormat = this.state.documentFormat;

  pageIndex = signal(0);
  pageSize = signal(10);
  selectedUnitId = signal<string | null>(null);
  dropdownOpen = signal(false);
  viewMode = signal<'compact' | 'spacious'>('spacious');

  // View Settings Dropdown
  viewSettingsOpen = signal(false);
  showIdColumn = signal(true);
  showSourceColumn = signal(true);
  showTargetColumn = signal(true);
  showNotesColumn = signal(true);

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

  toggleViewSettings() {
    this.viewSettingsOpen.update(v => !v);
  }

  closeViewSettings() {
    this.viewSettingsOpen.set(false);
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
