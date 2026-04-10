import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ImageUploadModalService {
  private readonly isOpen = signal(false);
  
  readonly isOpen$ = this.isOpen.asReadonly();

  open(): void {
    this.isOpen.set(true);
  }

  close(): void {
    this.isOpen.set(false);
  }

  toggle(): void {
    this.isOpen.update(v => !v);
  }
}
