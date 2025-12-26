import { Component, input, output } from '@angular/core';
import { TranslationUnit } from '../../models/translation-unit.model';

@Component({
  selector: 'app-translation-table',
  standalone: true,
  template: `
    <div class="relative w-full overflow-auto">
      <table class="w-full caption-bottom text-sm">
        <thead class="[&_tr]:border-b">
          <tr class="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
            @if (showIdColumn()) {
              <th scope="col" class="h-12 px-4 text-left align-middle font-medium text-muted-foreground w-1/6">ID</th>
            }
            @if (showSourceColumn()) {
              <th scope="col" class="h-12 px-4 text-left align-middle font-medium text-muted-foreground w-1/3 text-foreground">Source</th>
            }
            @if (showTargetColumn()) {
              <th scope="col" class="h-12 px-4 text-left align-middle font-medium text-muted-foreground w-1/3 text-foreground">Target</th>
            }
            @if (showNotesColumn()) {
              <th scope="col" class="h-12 px-4 text-left align-middle font-medium text-muted-foreground w-1/6">Notes</th>
            }
          </tr>
        </thead>
        <tbody class="[&_tr:last-child]:border-0">
          @for (unit of units(); track unit.id) {
            <tr 
              class="border-b transition-colors hover:bg-muted/50 cursor-pointer"
              [class.bg-muted]="selectedId() === unit.id"
              (click)="unitSelect.emit(unit.id)"
            >
            @if (showIdColumn()) {
              <td class="p-4 align-middle font-mono text-xs break-all text-muted-foreground">
                {{ unit.id }}
              </td>
            }
            @if (showSourceColumn()) {
              <td 
                class="p-4 align-middle text-foreground transition-all duration-200"
                [class.whitespace-nowrap]="viewMode() === 'compact'"
                [class.truncate]="viewMode() === 'compact'"
                [class.max-w-[300px]]="viewMode() === 'compact'"
              >
                {{ unit.source }}
              </td>
            }
            @if (showTargetColumn()) {
              <td 
                class="p-4 align-middle text-foreground transition-all duration-200"
                [class.whitespace-nowrap]="viewMode() === 'compact'"
                [class.truncate]="viewMode() === 'compact'"
                [class.max-w-[300px]]="viewMode() === 'compact'"
              >
                 <div [class.text-muted-foreground]="!unit.target" [class.italic]="!unit.target" [class.truncate]="viewMode() === 'compact'">
                    {{ unit.target || 'Empty' }}
                 </div>
              </td>
            }
            @if (showNotesColumn()) {
              <td class="p-4 align-middle text-xs text-muted-foreground max-w-[200px] truncate" [title]="getNotesSummary(unit)">
                {{ getNotesSummary(unit) }}
              </td>
            }
            </tr>
          } @empty {
             <tr>
              <td colspan="999" class="p-4 text-center text-muted-foreground">No translations found</td>
            </tr>
          }
        </tbody>
      </table>
    </div>

    <!-- Pagination removed, moved to parent component -->
  `
})
export class TranslationTableComponent {
  units = input.required<TranslationUnit[]>();
  viewMode = input<'compact' | 'spacious'>('spacious');
  showIdColumn = input<boolean>(true);
  showSourceColumn = input<boolean>(true);
  showTargetColumn = input<boolean>(true);
  showNotesColumn = input<boolean>(true);
  selectedId = input<string | null>(null);

  unitSelect = output<string>();

  getNotesSummary(unit: TranslationUnit): string {
    if (!unit.notes || unit.notes.length === 0) return '';
    return unit.notes.filter(n => n.type === 'note').sort((a, b) => (a.priority ?? 0) - (b.priority ?? 0)).map(n => n.content).join(' | ');
  }
}
