import { Component, input, output, signal } from '@angular/core';
import { TranslationUnit } from '../../models/translation-unit.model';

@Component({
  selector: 'app-translation-table',
  standalone: true,
  template: `
    <div class="relative w-full overflow-auto">
      <table class="w-full caption-bottom text-sm">
        <thead class="[&_tr]:border-b">
          <tr class="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
            <th scope="col" class="h-12 px-4 text-left align-middle font-medium text-muted-foreground w-1/6">ID</th>
            <th scope="col" class="h-12 px-4 text-left align-middle font-medium text-muted-foreground w-1/3 text-foreground">Source</th>
            <th scope="col" class="h-12 px-4 text-left align-middle font-medium text-muted-foreground w-1/3 text-foreground">Target</th>
            <th scope="col" class="h-12 px-4 text-left align-middle font-medium text-muted-foreground w-1/6">Notes</th>
          </tr>
        </thead>
        <tbody class="[&_tr:last-child]:border-0">
          @for (unit of units(); track unit.id) {
            <tr 
              class="border-b transition-colors hover:bg-muted/50 cursor-pointer"
              [class.bg-muted]="selectedId() === unit.id"
              (click)="unitSelect.emit(unit.id)"
            >
            <td class="p-4 align-middle font-mono text-xs break-all text-muted-foreground">
              {{ unit.id }}
            </td>
            <td 
              class="p-4 align-middle text-foreground transition-all duration-200"
              [class.whitespace-nowrap]="viewMode() === 'compact'"
              [class.truncate]="viewMode() === 'compact'"
              [class.max-w-[300px]]="viewMode() === 'compact'"
            >
              {{ unit.source }}
            </td>
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
              <td class="p-4 align-middle text-xs text-muted-foreground">
                {{ unit.note }}
              </td>
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
  selectedId = input<string | null>(null);

  unitSelect = output<string>();
}
