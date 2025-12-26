import { DOCUMENT, DecimalPipe } from '@angular/common';
import { Component, ElementRef, computed, effect, inject, signal, viewChild } from '@angular/core';
import { ExportFormat } from '../../services/parsers/translation-parser.interface';
import { TranslationStateService } from '../../services/translation-state.service';
import { PaginationComponent } from '../../ui/pagination/pagination.component';
import { TranslationDetailComponent } from '../../ui/translation-detail/translation-detail.component';
import { TranslationTableComponent } from '../../ui/translation-table/translation-table.component';
import { LandingScreenComponent } from '../landing-screen/landing-screen.component';

@Component({
  selector: 'app-translations-editor',
  standalone: true,
  imports: [LandingScreenComponent, TranslationTableComponent, TranslationDetailComponent, DecimalPipe, PaginationComponent],
  templateUrl: './translations-editor.component.html',
})
export class TranslationsEditorComponent {
  private state = inject(TranslationStateService);
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
  features = this.state.features;
  supportedExportFormats = this.state.supportedExportFormats;

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

      // Initialize export filename
      let name = file.name;
      if (name.endsWith('.xlf') || name.endsWith('.xliff') || name.endsWith('.json')) {
        name = name.substring(0, name.lastIndexOf('.'));
      }
      this.exportFilename.set(name);

      // Initialize selected export format based on first supported format
      const formats = this.supportedExportFormats();
      if (formats.length > 0) {
        this.selectedExport.set(formats[0]);
      } else {
        this.selectedExport.set(null);
      }
    } catch (e) {
      console.error(e);
      alert('Failed to parse file');
    }
  }

  constructor() {
    effect(() => {
      const features = this.features();
      this.showSourceColumn.set(features.hasSource);
      this.showNotesColumn.set(features.hasNotes);
    });

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
    const nextIndex = currentIndex + direction;

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

  // Export Settings
  protected readonly exportDropdownOpen = signal(false);
  protected readonly exportFilename = signal('');
  protected readonly includeLocaleSuffix = signal(true);
  protected readonly selectedExport = signal<ExportFormat | null>(null);

  protected readonly exportFilenamePreview = computed(() => {
    const baseName = this.exportFilename() || 'translations';
    const selected = this.selectedExport();
    const lang = this.targetLang();

    if (!selected) return baseName;

    const suffix = (this.includeLocaleSuffix() && lang) ? `.${lang}` : '';
    const extension = selected.type === 'json' ? '.json' : '.xlf';

    return `${baseName}${suffix}${extension}`;
  });

  protected readonly exportLabel = computed(() => {
    const selected = this.selectedExport();
    if (!selected) return 'Export';

    if (selected.type === 'xliff') return 'XLIFF';
    if (selected.jsonFormat === 'flat') return 'JSON (Flat)';
    if (selected.jsonFormat === 'nested') return 'JSON (Nested)';
    if (selected.jsonFormat === 'angular') return 'JSON (Angular)';

    return 'Export';
  });

  exportFile(format?: 'xliff' | 'json', jsonFormat?: 'flat' | 'nested' | 'angular') {
    let targetFormat: 'xliff' | 'json';
    let targetJsonFormat: 'flat' | 'nested' | 'angular' | undefined;

    if (format) {
      targetFormat = format;
      targetJsonFormat = jsonFormat;
      this.selectedExport.set({ type: format, jsonFormat } as ExportFormat);
    } else {
      const selected = this.selectedExport();
      if (selected) {
        targetFormat = selected.type;
        targetJsonFormat = selected.type === 'json' ? selected.jsonFormat : undefined;
      } else {
        // Fallback: This shouldn't normally happen if supportedExportFormats is populated
        targetFormat = 'xliff';
      }
    }

    const content = this.state.getExportContent(targetFormat, targetJsonFormat);
    const blob = new Blob([content], { type: targetFormat === 'json' ? 'application/json' : 'application/xliff+xml' });
    const url = URL.createObjectURL(blob);

    const a = this.document.createElement('a');
    a.href = url;
    a.download = this.exportFilenamePreview();
    a.click();
    URL.revokeObjectURL(url);
    this.closeExportDropdown();
  }

  toggleExportDropdown() {
    this.exportDropdownOpen.update(v => !v);
  }

  closeExportDropdown() {
    this.exportDropdownOpen.set(false);
  }

  onExportFilenameChange(event: Event) {
    const val = (event.target as HTMLInputElement).value;
    this.exportFilename.set(val);
  }

  selectExportFormat(format: ExportFormat) {
    this.selectedExport.set(format);
  }

  toggleIncludeLocaleSuffix() {
    if (!this.targetLang()) return;
    this.includeLocaleSuffix.update(v => !v);
  }
}
