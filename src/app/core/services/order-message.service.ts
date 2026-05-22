import { Injectable, inject } from '@angular/core';
import { Order } from '@features/orders/models/order.model';
import { CartItem } from '@features/menu/models/cart-item.model';
import { CategoryService } from '@features/menu/services/category.service';
import { SubcategoryService } from '@features/menu/services/subcategory.service';

@Injectable({ providedIn: 'root' })
export class OrderMessageService {
  // Emojis y estilos visuales
  private readonly coffeeEmoji = '☕';
  private readonly foodEmoji = '🍽️';
  private readonly dessertEmoji = '🍰';
  private readonly drinkEmoji = '🥤';
  private readonly additionEmoji = '✨';
  private readonly totalEmoji = '💵';
  private readonly separator = '━━━━━━━━━━━━━━━━━━';
  private readonly bullet = '•';

  private readonly categoryService = inject(CategoryService);
  private readonly subcategoryService = inject(SubcategoryService);

  buildWhatsAppMessage(order: Order): string {
    // Obtener todas las categorías y subcategorías cargadas
    const categories = this.categoryService.categories();
    const subcategories = this.subcategoryService.subcategories();

    let message = `${this.coffeeEmoji} *¡Nuevo Pedido Coffee House!* ${this.coffeeEmoji}\n`;
    message += `${this.separator}\n`;

    order.items.forEach((item: CartItem, idx: number) => {
      // Buscar categoría y subcategoría
      let categoryName = '';
      if (item.product.subcategoryId) {
        const subcat = subcategories.find(s => s.id === item.product.subcategoryId);
        if (subcat) {
          const cat = categories.find(c => c.id === subcat.categoryId);
          if (cat) categoryName = cat.name;
        }
      } else if (item.product.categoryId) {
        const cat = categories.find(c => c.id === item.product.categoryId);
        if (cat) categoryName = cat.name;
      }

      // Elegir emoji según categoría
      let catEmoji = this.foodEmoji;
      if (categoryName.toLowerCase().includes('bebida')) catEmoji = this.drinkEmoji;
      if (categoryName.toLowerCase().includes('postre')) catEmoji = this.dessertEmoji;

      message += `*${idx + 1}. ${catEmoji} ${item.product.name}*  _x${item.qty}_  [$${item.product.price}]\n`;
      if (categoryName) {
        message += `   ${this.bullet} *Categoría:* ${categoryName}\n`;
      }
      if (item.selectedAdditions && item.selectedAdditions.length > 0) {
        message += `   ${this.bullet} *Adiciones:*\n`;
        item.selectedAdditions.forEach((add: any) => {
          message += `      ${this.additionEmoji} ${add.name} ($${add.price})\n`;
        });
      }
      message += `\n`;
    });

    message += `${this.separator}\n`;
    message += `${this.totalEmoji} *Total Pedido: $${order.total}*\n`;
    message += `${this.separator}\n`;
    message += `🧑‍💼 *Nombre:* (escribe aquí tu nombre)\n`;
    message += `📝 *Observaciones:* (agrega aquí tus observaciones)\n`;
    message += `\n🙏 ¡Gracias por tu pedido! 🙏`;
    return message;
  }
}
