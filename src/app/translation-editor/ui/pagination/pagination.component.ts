import { Component, computed, input, output } from '@angular/core';

@Component({
    selector: 'app-pagination',
    standalone: true,
    template: `
    <nav role="navigation" aria-label="pagination" class="mx-auto flex w-full justify-center">
      <ul class="flex flex-row items-center gap-1">
        <!-- Previous -->
        <li>
          <button
            class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 gap-1 pl-2.5"
            [disabled]="pageIndex() === 0"
            (click)="onPageChange(pageIndex() - 1)"
            aria-label="Go to previous page"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4"><path d="m15 18-6-6 6-6"/></svg>
            <span>Previous</span>
          </button>
        </li>

        <!-- Pages -->
        @for (page of pages(); track page) {
          <li>
            @if (page === '...') {
              <span aria-hidden="true" class="flex h-9 w-9 items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
              </span>
            } @else {
              <button
                class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-10 w-10"
                [class.border]="page === pageIndex() + 1"
                [class.border-input]="page === pageIndex() + 1"
                [class.bg-background]="page === pageIndex() + 1"
                [class.shadow-sm]="page === pageIndex() + 1"
                [class.hover:bg-accent]="page !== pageIndex() + 1"
                [class.hover:text-accent-foreground]="page !== pageIndex() + 1"
                (click)="onPageChange(+page - 1)"
              >
                {{ page }}
              </button>
            }
          </li>
        }

        <!-- Next -->
        <li>
          <button
            class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 gap-1 pr-2.5"
            [disabled]="(pageIndex() + 1) * pageSize() >= total()"
            (click)="onPageChange(pageIndex() + 1)"
            aria-label="Go to next page"
          >
            <span>Next</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4"><path d="m9 18 6-6-6-6"/></svg>
          </button>
        </li>
      </ul>
    </nav>
  `
})
export class PaginationComponent {
    pageIndex = input.required<number>();
    pageSize = input.required<number>();
    total = input.required<number>();

    pageChange = output<number>();

    pages = computed(() => {
        const totalPages = Math.ceil(this.total() / this.pageSize());
        const currentPage = this.pageIndex() + 1;
        const delta = 2; // Number of pages to show around current page

        const range = [];
        for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
            range.push(i);
        }

        if (currentPage - delta > 2) {
            range.unshift('...');
        }
        if (currentPage + delta < totalPages - 1) {
            range.push('...');
        }

        range.unshift(1);
        if (totalPages > 1) {
            range.push(totalPages);
        }

        return range;
    });

    onPageChange(index: number) {
        this.pageChange.emit(index);
    }
}
