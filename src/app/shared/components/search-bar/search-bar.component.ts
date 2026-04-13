import { Component, EventEmitter, Output, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-search-bar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './search-bar.component.html',
  styleUrls: ['./search-bar.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SearchBarComponent {

  protected readonly term = signal<string>('');
  @Output() search = new EventEmitter<string>();

  onInput(): void {
    const value = this.term();
    this.search.emit(value);
  }
}
