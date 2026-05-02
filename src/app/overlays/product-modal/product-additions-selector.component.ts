import {
  Component,
  ChangeDetectionStrategy,
  Input,
  Output,
  EventEmitter,
  inject,
  OnInit,
  OnChanges,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductAddition } from '../../features/menu/models/product-addition.model';
import { ProductAdditionsService } from '../../core/services/product-additions.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-product-additions-selector',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-2">
      <ng-container *ngFor="let addition of (additions$ | async)">
        <label
          class="flex items-center gap-3 p-3 rounded-lg border-2 transition cursor-pointer hover:border-primary"
          [style.borderColor]="isSelected(addition) ? 'var(--color-primary)' : 'rgba(0,0,0,0.1)'"
          [style.backgroundColor]="isSelected(addition) ? 'rgba(var(--color-primary-rgb), 0.05)' : 'transparent'">
          <input
            type="checkbox"
            [checked]="isSelected(addition)"
            (change)="onSelectAddition(addition)"
            class="w-4 h-4 cursor-pointer">
          <span class="flex-1 font-semibold text-sm text-text">{{ addition.name }}</span>
          <span *ngIf="addition.price > 0" class="text-sm font-semibold text-primary">
            +$ {{ addition.price | number:'1.0-0' }}
          </span>
          <span *ngIf="addition.price === 0" class="text-xs text-text-secondary">Incluido</span>
        </label>
      </ng-container>
    </div>
  `,
  styles: [':host { display: block; }'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductAdditionsSelectorComponent implements OnInit, OnChanges {
  @Input() productId: number | null = null;
  @Output() selectionsChanged = new EventEmitter<ProductAddition[]>();

  private readonly additionsService = inject(ProductAdditionsService);
  private readonly selectedAdditionsSignal = signal<ProductAddition[]>([]);
  private readonly productIdSignal = signal<number | null>(null);

  additions$!: Observable<ProductAddition[]>;

  ngOnInit(): void {
    if (this.productId) {
      this.productIdSignal.set(this.productId);
      this.additions$ = this.additionsService.getAdditionsForProduct(this.productId);
    }
  }

  ngOnChanges(): void {
    if (this.productId !== this.productIdSignal()) {
      this.productIdSignal.set(this.productId || 0);
      if (this.productId) {
        this.additions$ = this.additionsService.getAdditionsForProduct(this.productId);
      }
      this.selectedAdditionsSignal.set([]);
    }
  }

  onSelectAddition(addition: ProductAddition): void {
    const current = [...this.selectedAdditionsSignal()];
    const idx = current.findIndex(a => a.id === addition.id);
    if (idx >= 0) {
      current.splice(idx, 1);
    } else {
      current.push(addition);
    }
    this.selectedAdditionsSignal.set(current);
    this.selectionsChanged.emit(current);
  }

  isSelected(addition: ProductAddition): boolean {
    return this.selectedAdditionsSignal().some(a => a.id === addition.id);
  }

  getSelectedAdditions(): ProductAddition[] {
    return this.selectedAdditionsSignal();
  }
}
