import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-search-bar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <input
      type="text"
      class="w-full px-4 py-2 mb-6 border rounded-xl"
      placeholder="Buscar..."
      (input)="onInput($event)"
    />
  `
})
export class SearchBarComponent {

  @Output() search = new EventEmitter<string>();

  onInput(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.search.emit(value); // 👉 emitimos string
  }
}
