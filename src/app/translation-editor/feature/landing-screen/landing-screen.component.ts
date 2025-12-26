import { ChangeDetectionStrategy, Component, output } from '@angular/core';
import { FileUploadComponent } from '../../ui/file-upload/file-upload.component';

@Component({
  selector: 'app-landing-screen',
  standalone: true,
  imports: [FileUploadComponent],
  template: `
    <main class="flex-1 overflow-auto">
      <div class="min-h-full flex flex-col items-center justify-center p-6 text-center max-w-4xl mx-auto py-20">
        <!-- Hero Section -->
        <div class="mb-12 space-y-4">
          <h1 class="text-5xl md:text-6xl font-extrabold tracking-tight text-foreground">
            Simple <span class="bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600">Translation Editor</span>
          </h1>
          <p class="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Simple and easy to use translation editor for developers and translators.<br />
            Support <span class="text-foreground font-semibold">XLIFF 1.2</span>, <span class="text-foreground font-semibold">XLIFF 2.0</span> and <span class="text-foreground font-semibold">JSON</span>.
          </p>
        </div>

        <!-- Main Action -->
        <div class="w-full mb-16">
          <app-file-upload (fileSelected)="onFileSelected($event)" />
        </div>
      </div>
    </main>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LandingScreenComponent {
  fileSelected = output<File>();

  onFileSelected(file: File) {
    this.fileSelected.emit(file);
  }
}
