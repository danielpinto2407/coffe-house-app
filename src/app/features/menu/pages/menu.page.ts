import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CATEGORIES, SUBCATEGORIES, PRODUCTS } from '../data/menu.mock';
import { ProductCardComponent } from '../../../shared/product-card/product-card.component';

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [CommonModule, ProductCardComponent],
  templateUrl: './menu.page.html',
})
export class MenuPage implements OnInit {

  menu: any[] = [];

  ngOnInit(): void {
    this.menu = CATEGORIES.map(cat => ({
      ...cat,
      subcategories: SUBCATEGORIES
        .filter(sub => sub.categoryId === cat.id)
        .sort((a, b) => a.order - b.order)
        .map(sub => ({
          ...sub,
          products: PRODUCTS
            .filter(p => p.subcategoryId === sub.id)
            .sort((a, b) => a.order - b.order)
        })),
    }));
  }
}
