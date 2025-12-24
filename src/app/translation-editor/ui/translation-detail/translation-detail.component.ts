import { Component, input, output, effect, viewChild, ElementRef, computed } from '@angular/core';
import { TranslationUnit } from '../../models/translation-unit.model';

@Component({
  selector: 'app-translation-detail',
  standalone: true,
  template: `
    <div class="h-full flex flex-col bg-background border-l border-border pointer-events-auto">
      <div class="flex items-center justify-between p-4 border-b border-border">
        <h2 class="text-lg font-semibold text-foreground">Edit Translation</h2>
        <button 
          (click)="close.emit()"
          class="inline-flex items-center justify-center p-2 rounded-md font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground"
        >
          <span class="sr-only">Close</span>
          <svg class="w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div class="flex-1 overflow-y-auto p-4 space-y-6">
        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <label class="text-xs font-medium text-muted-foreground uppercase tracking-wider">ID</label>
            <button 
              (click)="copyToClipboard(unit().id)"
              class="text-xs text-primary hover:underline hover:text-primary/80 flex items-center gap-1"
              title="Copy ID"
            >
              <svg class="w-3 h-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Copy
            </button>
          </div>
          <div class="font-mono text-sm text-foreground bg-muted/50 p-2 rounded break-all select-all">
            {{ unit().id }}
          </div>
        </div>

        @if (showSource()) {
        <div class="space-y-2">
           <div class="flex items-center justify-between">
            <label class="text-xs font-medium text-muted-foreground uppercase tracking-wider">Source Text</label>
            <button 
              (click)="copyToClipboard(unit().source)"
              class="text-xs text-primary hover:underline hover:text-primary/80 flex items-center gap-1"
              title="Copy Source"
            >
              <svg class="w-3 h-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Copy
            </button>
          </div>
          <div class="text-sm text-foreground bg-muted/30 p-3 rounded border border-border">
            {{ unit().source }}
          </div>
        </div>
        }

        @if (showNotes() && unit().notes && unit().notes!.length > 0) {
          <div class="space-y-4">
            <label class="text-xs font-medium text-muted-foreground uppercase tracking-wider">Metadata & Context</label>
            <div class="space-y-3">
              @for (note of sortedNotes(); track $index) {
                <div class="p-3 rounded-lg border border-border bg-muted/20 space-y-2">
                  <div class="flex items-center gap-2 flex-wrap">
                    @if (note.type === 'note') {
                      @if (note.from) {
                        <span class="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-muted text-muted-foreground border">
                          {{ note.from }}
                        </span>
                      }
                      @if (note.category) {
                        <span class="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-100 text-blue-700 border border-blue-200">
                          {{ note.category }}
                        </span>
                      }
                    } @else if (note.type === 'location') {
                       @if (note.purpose !== 'location') {
                        <span class="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-purple-100 text-purple-700 border border-purple-200">
                          {{ note.purpose }}
                        </span>
                      }
                      <span class="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-muted text-muted-foreground border">
                        Sourcefile
                      </span>
                    }
                  </div>
                  <div class="text-sm text-foreground break-all" [class.font-mono]="note.type === 'location'">
                    {{ note.content }}
                  </div>
                </div>
              }
            </div>
          </div>
        }

        <div class="space-y-2">
          <label for="target-input" class="text-xs font-medium text-muted-foreground uppercase tracking-wider">Target Text</label>
          <textarea 
            #targetInput
            id="target-input"
            class="flex min-h-[150px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            [value]="unit().target"
            (input)="onInput($event)"
            (keydown.escape)="targetInput.blur()"
            placeholder="Enter translation..."
          ></textarea>
        </div>
      </div>
      
      <div class="p-4 border-t border-border bg-muted/10">
        <div class="text-xs text-muted-foreground text-center">
            Changes are saved automatically
        </div>
      </div>
    </div>
  `
})
export class TranslationDetailComponent {
  unit = input.required<TranslationUnit>();
  showSource = input<boolean>(true);
  showNotes = input<boolean>(true);
  close = output<void>();
  save = output<{ id: string, target: string }>();

  sortedNotes = computed(() => {
    const notes = this.unit().notes;
    if (!notes) return [];

    return [...notes].sort((a, b) => {
      const getPriority = (n: any) => {
        if (n.type === 'note' && n.priority) {
          return parseInt(n.priority, 10);
        }
        return 10; // Default lower priority for locations or notes without priority
      };
      return getPriority(a) - getPriority(b);
    });
  });

  targetInput = viewChild<ElementRef<HTMLTextAreaElement>>('targetInput');

  // Simple copy feedback state could be added here if needed, keeping it simple for now.

  focus() {
    setTimeout(() => {
      this.targetInput()?.nativeElement.focus();
    }, 0);
  }

  constructor() {
    // Aggressive focus removed to allow table navigation via keyboard
  }

  onInput(event: Event) {
    const value = (event.target as HTMLTextAreaElement).value;
    this.save.emit({ id: this.unit().id, target: value });
  }

  copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    // Optional: toast or feedback could go here
  }
}
