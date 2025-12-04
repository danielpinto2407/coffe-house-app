import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CATEGORIES, SUBCATEGORIES, PRODUCTS } from '../data/menu.mock';
import { ProductCardComponent } from '../../../shared/product-card/product-card.component';
import { SearchBarComponent } from '../../../shared/components/search-bar/search-bar.component';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [CommonModule, ProductCardComponent, SearchBarComponent, FormsModule],
  templateUrl: './menu.page.html',
})
export class MenuPage implements OnInit {

  fullMenu: any[] = []; // Menú completo (sin filtrar)
  menu: any[] = [];     // Menú actual filtrado
  searchTerm = '';

  ngOnInit(): void {
    this.fullMenu = this.buildMenuStructure();
    this.menu = this.fullMenu;
  }

  //-------------------------------------
  // Construye el menú original completo
  //-------------------------------------
  buildMenuStructure() {
    return CATEGORIES.map(cat => ({
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

  //-------------------------------------
  // Filtro desde el componente SearchBar
  //-------------------------------------
  onSearch(term: string) {
    const search = term.toLowerCase().trim();
    this.searchTerm = search;

    // Si está vacío → restaurar menú completo
    if (!search) {
      this.menu = this.fullMenu;
      return;
    }

    // Filtrado profundo
    this.menu = this.fullMenu
      .map(cat => {
        const subcategories = cat.subcategories
          .map((sub: { products: any[]; }) => {
            const products = sub.products.filter(p => {
              const name = p.name?.toLowerCase() || '';
              const desc = p.description?.toLowerCase() || '';
              return name.includes(search) || desc.includes(search);
            });
            return { ...sub, products };
          })
          .filter((sub: { products: string | any[]; }) => sub.products.length > 0);

        return { ...cat, subcategories };
      })
      .filter(cat => cat.subcategories.length > 0);
  }
}
