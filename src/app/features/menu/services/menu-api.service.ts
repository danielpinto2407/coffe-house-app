import { Injectable } from '@angular/core';
import { CATEGORIES, SUBCATEGORIES, PRODUCTS } from '../data/menu.mock';
import { map, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class MenuApiService {

  getFullMenu() {
    return of(CATEGORIES).pipe(
      map(categories =>
        categories.map(category => ({
          ...category,
          subcategories: SUBCATEGORIES
            .filter(s => s.categoryId === category.id)
            .sort((a, b) => a.order - b.order)
            .map(sub => ({
              ...sub,
              products: PRODUCTS
                .filter(p => p.subcategoryId === sub.id)
                .sort((a, b) => a.order - b.order)
            }))
        })).sort((a, b) => a.order - b.order)
      )
    );
  }
}
