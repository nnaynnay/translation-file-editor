import { Component, ElementRef, computed, input, output, viewChild } from '@angular/core';
import { TranslationNote, TranslationUnit } from '../../models/translation-unit.model';

@Component({
  selector: 'app-translation-detail',
  standalone: true,
  templateUrl: './translation-detail.component.html'
})
export class TranslationDetailComponent {
  unit = input.required<TranslationUnit>();
  showSource = input<boolean>(true);
  showNotes = input<boolean>(true);
  closed = output<void>();
  save = output<{ id: string, target: string }>();

  sortedNotes = computed(() => {
    const notes = this.unit().notes;
    if (!notes) return [];

    return [...notes].sort((a, b) => {
      const getPriority = (n: TranslationNote) => {
        if (n.type === 'note' && n.priority) {
          return n.priority;
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
