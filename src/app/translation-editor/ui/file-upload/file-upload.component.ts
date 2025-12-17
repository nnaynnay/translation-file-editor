import { Component, output, signal } from '@angular/core';

@Component({
    selector: 'app-file-upload',
    standalone: true,
    template: `
    <div 
      class="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 dark:hover:bg-gray-800 dark:bg-gray-700 hover:border-blue-500 transition-colors"
      (dragover)="onDragOver($event)"
      (dragleave)="onDragLeave($event)"
      (drop)="onDrop($event)"
      [class.border-blue-500]="isDragging()"
      [class.border-gray-300]="!isDragging()"
      (click)="fileInput.click()"
    >
      <div class="flex flex-col items-center justify-center pt-5 pb-6">
        <svg class="w-8 h-8 mb-4 text-gray-500 dark:text-gray-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
          <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
        </svg>
        <p class="mb-2 text-sm text-gray-500 dark:text-gray-400"><span class="font-semibold">Click to upload</span> or drag and drop</p>
        <p class="text-xs text-gray-500 dark:text-gray-400">XLIFF files (.xlf) only</p>
      </div>
      <input 
        #fileInput 
        type="file" 
        class="hidden" 
        accept=".xlf,.xliff" 
        (change)="onFileSelected($event)" 
      />
    </div>
  `
})
export class FileUploadComponent {
    fileSelected = output<File>();
    isDragging = signal(false);

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
        if (file.name.endsWith('.xlf') || file.name.endsWith('.xliff')) {
            this.fileSelected.emit(file);
        } else {
            alert('Please upload a valid .xlf file');
        }
    }
}
