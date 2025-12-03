import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface ProductData {
  id: number;
  name: string;
  price: number;
  description?: string;
  image?: string;
}

@Injectable({ providedIn: 'root' })
export class ProductModalService {

  private productSubject = new BehaviorSubject<ProductData | null>(null);
  product$ = this.productSubject.asObservable();

  open(product: ProductData) {
    this.productSubject.next(product);
  }

  close() {
    this.productSubject.next(null);
  }
}
