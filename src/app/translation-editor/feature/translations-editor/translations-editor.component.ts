import { Component, computed, inject, signal, effect, viewChild, ElementRef } from '@angular/core';
import { XliffStateService } from '../../services/xliff-state.service';
import { FileUploadComponent } from '../../ui/file-upload/file-upload.component';
import { TranslationTableComponent } from '../../ui/translation-table/translation-table.component';
import { TranslationDetailComponent } from '../../ui/translation-detail/translation-detail.component';
import { PaginationComponent } from '../../ui/pagination/pagination.component';
import { DOCUMENT, DecimalPipe } from '@angular/common';

@Component({
  selector: 'translations-editor',
  standalone: true,
  imports: [FileUploadComponent, TranslationTableComponent, TranslationDetailComponent, DecimalPipe, PaginationComponent],
  templateUrl: './translations-editor.component.html',
})
export class TranslationsEditorComponent {
  private state = inject(XliffStateService);
  private document = inject(DOCUMENT);

  searchInput = viewChild<ElementRef<HTMLInputElement>>('searchInput');
  detailView = viewChild(TranslationDetailComponent);

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
        // Search focus: Cmd/Ctrl + K
        if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
          e.preventDefault();
          this.searchInput()?.nativeElement.focus();
          return;
        }

        const isEditing = (e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'TEXTAREA';

        if (!isEditing) {
          // Pagination: Arrows
          if (e.key === 'ArrowLeft') {
            this.changePage(this.pageIndex() - 1);
            return;
          } else if (e.key === 'ArrowRight') {
            this.changePage(this.pageIndex() + 1);
            return;
          }

          // Close detail view: Escape
          if (e.key === 'Escape' && this.selectedUnitId()) {
            this.selectedUnitId.set(null);
            return;
          }

          // Table Selection: Up/Down
          const units = this.paginatedUnits();
          if (units.length > 0) {
            if (e.key === 'ArrowDown') {
              e.preventDefault();
              this.navigateSelection(1);
            } else if (e.key === 'ArrowUp') {
              e.preventDefault();
              this.navigateSelection(-1);
            } else if (e.key === 'Enter' && this.selectedUnitId()) {
              e.preventDefault();
              this.selectUnit(this.selectedUnitId()!, true);
            }
          }
        }
      };
      document.addEventListener('keydown', handleKeydown);
      onCleanup(() => document.removeEventListener('keydown', handleKeydown));
    });
  }

  private navigateSelection(direction: number) {
    const units = this.paginatedUnits();
    const currentId = this.selectedUnitId();

    if (!currentId) {
      this.selectUnit(units[0].id);
      return;
    }

    const currentIndex = units.findIndex(u => u.id === currentId);
    let nextIndex = currentIndex + direction;

    if (nextIndex >= 0 && nextIndex < units.length) {
      this.selectUnit(units[nextIndex].id);

      // Auto-scroll logic could be added here if the table was very long and scrollable
      // but the units are paginated (10 per page), so they should be visible.
    }
  }

  changePage(newIndex: number) {
    const totalPages = Math.ceil(this.totalItems() / this.pageSize());
    if (newIndex >= 0 && newIndex < totalPages) {
      this.pageIndex.set(newIndex);
      this.selectedUnitId.set(null);
    }
  }

  onSearchInput(event: Event) {
    const val = (event.target as HTMLInputElement).value;
    this.state.filterQuery.set(val);
    this.pageIndex.set(0);
    this.selectedUnitId.set(null);
  }

  onSearchEnter(event: Event) {
    const input = event.target as HTMLInputElement;
    input.blur();
    const units = this.paginatedUnits();
    if (units.length > 0) {
      this.selectUnit(units[0].id);
    }
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

  selectUnit(id: string, shouldFocus = false) {
    this.selectedUnitId.set(id);
    if (shouldFocus) {
      // Need to wait for change detection to render the new unit if it wasn't visible
      setTimeout(() => this.detailView()?.focus(), 0);
    }
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
