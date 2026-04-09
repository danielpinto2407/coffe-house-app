import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Product } from '../../features/menu/models/product.model';

@Injectable({ providedIn: 'root' })
export class ProductModalService {

  private readonly productSubject = new BehaviorSubject<Product | null>(null);
  readonly product$ = this.productSubject.asObservable();

  open(product: Product): void {
    this.productSubject.next(product);
  }

  close(): void {
    this.productSubject.next(null);
  }
}
