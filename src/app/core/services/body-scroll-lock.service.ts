import { Injectable, Renderer2, RendererFactory2, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';

@Injectable({ providedIn: 'root' })
export class BodyScrollLockService {
  private readonly doc = inject(DOCUMENT);
  private readonly renderer: Renderer2;
  private readonly locks = new Set<string>();

  constructor() {
    const rendererFactory = inject(RendererFactory2);
    this.renderer = rendererFactory.createRenderer(null, null);
  }

  lock(source: string): void {
    this.locks.add(source);
    this.apply();
  }

  unlock(source: string): void {
    this.locks.delete(source);
    this.apply();
  }

  private apply(): void {
    if (globalThis.window === undefined || !this.doc?.body) {
      return;
    }

    if (this.locks.size > 0) {
      this.renderer.setStyle(this.doc.body, 'overflow', 'hidden');
      return;
    }

    this.renderer.removeStyle(this.doc.body, 'overflow');
  }
}