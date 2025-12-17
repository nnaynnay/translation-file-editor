import { Component, input, output, signal } from '@angular/core';
import { TranslationUnit } from '../../models/translation-unit.model';

@Component({
    selector: 'app-translation-table',
    standalone: true,
    template: `
    <div class="relative overflow-x-auto shadow-md sm:rounded-lg">
      <table class="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
        <thead class="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
          <tr>
            <th scope="col" class="px-6 py-3 w-1/6">ID</th>
            <th scope="col" class="px-6 py-3 w-1/3">Source</th>
            <th scope="col" class="px-6 py-3 w-1/3">Target</th>
            <th scope="col" class="px-6 py-3 w-1/6">Notes</th>
          </tr>
        </thead>
        <tbody>
          @for (unit of units(); track unit.id) {
            <tr class="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
              <td class="px-6 py-4 font-mono text-xs break-all">
                {{ unit.id }}
              </td>
              <td class="px-6 py-4">
                {{ unit.source }}
              </td>
              <td class="px-6 py-4">
                @if (editingId() === unit.id) {
                  <textarea 
                    class="block w-full p-2.5 text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" 
                    [value]="unit.target"
                    (blur)="onSave(unit.id, $any($event.target).value)"
                    (keydown.enter)="$event.preventDefault(); $any($event.target).blur()"
                    rows="3"
                    autoFocus
                  ></textarea>
                } @else {
                  <div 
                    class="cursor-pointer min-h-[20px] p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded border border-transparent hover:border-gray-300"
                    (click)="editingId.set(unit.id)"
                    [class.text-gray-400]="!unit.target"
                    [class.italic]="!unit.target"
                  >
                    {{ unit.target || 'Click to translate...' }}
                  </div>
                }
              </td>
              <td class="px-6 py-4 text-xs text-gray-400">
                {{ unit.note }}
              </td>
            </tr>
          } @empty {
             <tr>
              <td colspan="4" class="px-6 py-4 text-center">No translations found</td>
            </tr>
          }
        </tbody>
      </table>
    </div>

    <!-- Simple Pagination Controls -->
    <nav class="flex items-center flex-column flex-wrap md:flex-row justify-between pt-4" aria-label="Table navigation">
      <span class="text-sm font-normal text-gray-500 dark:text-gray-400 mb-4 md:mb-0 block w-full md:inline md:w-auto">
        Showing <span class="font-semibold text-gray-900 dark:text-white">{{ (pageIndex() * pageSize()) + 1 }}-{{ min((pageIndex() + 1) * pageSize(), total()) }}</span> of <span class="font-semibold text-gray-900 dark:text-white">{{ total() }}</span>
      </span>
      <ul class="inline-flex -space-x-px rtl:space-x-reverse text-sm h-8">
        <li>
          <button 
            (click)="prevPage()"
            [disabled]="pageIndex() === 0"
            class="flex items-center justify-center px-3 h-8 ms-0 leading-tight text-gray-500 bg-white border border-gray-300 rounded-s-lg hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white disabled:opacity-50"
          >
            Previous
          </button>
        </li>
        <li>
          <button 
            (click)="nextPage()"
            [disabled]="(pageIndex() + 1) * pageSize() >= total()"
            class="flex items-center justify-center px-3 h-8 leading-tight text-gray-500 bg-white border border-gray-300 rounded-e-lg hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white disabled:opacity-50"
          >
            Next
          </button>
        </li>
      </ul>
    </nav>
  `
})
export class TranslationTableComponent {
    units = input.required<TranslationUnit[]>();
    total = input.required<number>();
    pageIndex = input.required<number>();
    pageSize = input.required<number>();

    pageChange = output<number>();
    unitUpdate = output<{ id: string, target: string }>();

    editingId = signal<string | null>(null);

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

    onSave(id: string, value: string) {
        this.unitUpdate.emit({ id, target: value });
        this.editingId.set(null);
    }
}
