import { Component, output, signal } from '@angular/core';

const ACCEPTED_FILE_TYPES = ['.xlf', '.json'];

@Component({
  selector: 'app-file-upload',
  standalone: true,
  template: `
    <div 
      class="group relative flex flex-col items-center justify-center w-full max-w-xl mx-auto h-72 border-2 border-dashed rounded-2xl cursor-pointer bg-card hover:bg-accent/5 transition-all duration-300 ease-in-out overflow-hidden"
      tabindex="0"
      (dragover)="onDragOver($event)"
      (dragleave)="onDragLeave($event)"
      (drop)="onDrop($event)"
      [class.border-primary]="isDragging()"
      [class.bg-accent/10]="isDragging()"
      [class.border-muted-foreground/20]="!isDragging()"
      (click)="fileInput.click()"
      (keypress)="fileInput.click()"
    >
      <!-- Subtle Gradient Background -->
      <div class="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

      <div class="relative z-10 flex flex-col items-center justify-center p-8 text-center">
        <div class="w-16 h-16 mb-6 rounded-full bg-primary/10 flex items-center justify-center group-hover:scale-110 group-hover:bg-primary/20 transition-all duration-300">
          <svg class="w-8 h-8 text-primary" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" enable-background="new 0 0 24 24" height="24px" viewBox="0 0 24 24" width="24px" fill="#4B77D1"><g><rect fill="none" height="24" width="24"/></g><g><path d="M18,15v3H6v-3H4v3c0,1.1,0.9,2,2,2h12c1.1,0,2-0.9,2-2v-3H18z M7,9l1.41,1.41L11,7.83V16h2V7.83l2.59,2.58L17,9l-5-5L7,9z"/></g></svg>
        </div>
        
        <h3 class="text-xl font-bold tracking-tight text-foreground mb-2">Ready to translate?</h3>
        <p class="mb-4 text-sm text-muted-foreground max-w-[280px]">
          <span class="font-semibold text-primary">Click to upload</span> or drag and drop your files here.
        </p>
        
        <div class="flex items-center gap-3">
          @for (fileType of acceptedFileTypes; track fileType) {
            <span class="px-2.5 py-1 rounded-full bg-muted text-[10px] font-bold uppercase tracking-wider text-muted-foreground border">{{ fileType }}</span>          
          }
        </div>
      </div>
      
      <input 
        #fileInput 
        type="file" 
        class="hidden" 
        [accept]="acceptedFileTypes.join(',')"
        (change)="onFileSelected($event)" 
      />
    </div>
  `
})
export class FileUploadComponent {
  fileSelected = output<File>();
  isDragging = signal(false);

  acceptedFileTypes = ACCEPTED_FILE_TYPES;

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(true);
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.validateAndEmit(files[0]);
    }
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.validateAndEmit(input.files[0]);
    }
  }

  private validateAndEmit(file: File) {
    if (this.acceptedFileTypes.some(type => file.name.endsWith(type))) {
      this.fileSelected.emit(file);
    } else {
      alert(`Please upload a valid file type: ${this.acceptedFileTypes.join(', ')}`);
    }
  }
}
