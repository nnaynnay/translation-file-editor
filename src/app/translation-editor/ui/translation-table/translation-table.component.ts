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
              <td colspan="4" class="p-4 text-center text-muted-foreground">No translations found</td>
            </tr>
          }
        </tbody>
      </table>
    </div>

    <!-- Pagination Controls -->
    <div class="flex items-center justify-end space-x-2 py-4">
      <div class="flex-1 text-sm text-muted-foreground text-foreground">
        Showing <span class="font-medium text-foreground">{{ (pageIndex() * pageSize()) + 1 }}</span> to <span class="font-medium text-foreground">{{ min((pageIndex() + 1) * pageSize(), total()) }}</span> of <span class="font-medium text-foreground">{{ total() }}</span> entries
      </div>
      <div class="space-x-2">
        <button
          class="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-8 px-4 w-24"
          (click)="prevPage()"
          [disabled]="pageIndex() === 0"
        >
          Previous
        </button>
        <button
          class="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-8 px-4 w-24"
          (click)="nextPage()"
          [disabled]="(pageIndex() + 1) * pageSize() >= total()"
        >
          Next
        </button>
      </div>
    </div>
  `
})
export class TranslationTableComponent {
  units = input.required<TranslationUnit[]>();
  total = input.required<number>();
  pageIndex = input.required<number>();
  pageSize = input.required<number>();
  viewMode = input<'compact' | 'spacious'>('spacious');
  selectedId = input<string | null>(null);

  pageChange = output<number>();
  unitSelect = output<string>();

  min(a: number, b: number) {
    return Math.min(a, b);
  }

  prevPage() {
    if (this.pageIndex() > 0) {
      this.pageChange.emit(this.pageIndex() - 1);
    }
  }

  nextPage() {
    if ((this.pageIndex() + 1) * this.pageSize() < this.total()) {
      this.pageChange.emit(this.pageIndex() + 1);
    }
  }
}
