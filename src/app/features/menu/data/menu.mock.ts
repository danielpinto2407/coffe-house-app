import { Category } from "../models/category.model";
import { Subcategory } from "../models/subcategory.model";
import { Product } from "../models/product.model";

export const CATEGORIES: Category[] = [
  { id: 1, name: "Bebidas", order: 1, description: "Refrescos, cafés y tés para cualquier momento del día." },
  { id: 2, name: "Postres", order: 2, description: "Delicias dulces para endulzar tu jornada." },
  { id: 3, name: "Alimentos", order: 3, description: "Comidas nutritivas y energéticas para tu día." },
];

export const SUBCATEGORIES: Subcategory[] = [
  { id: 10, categoryId: 1, name: "Calientes", order: 1, description: "Cafés y chocolates calientes para empezar bien el día." },
  { id: 11, categoryId: 1, name: "Frías", order: 2, description: "Bebidas refrescantes y frías para cualquier momento." },
  { id: 12, categoryId: 1, name: "Té e Infusiones", order: 3, description: "Variedad de tés e infusiones aromáticas y relajantes." },
  { id: 13, categoryId: 1, name: "Batidos", order: 4, description: "Batidos de frutas naturales y energizantes." },
  { id: 20, categoryId: 2, name: "Repostería", order: 1, description: "Pasteles, galletas y más, recién horneados." },
  { id: 21, categoryId: 2, name: "Helados", order: 2, description: "Helados cremosos de diferentes sabores." },
  { id: 22, categoryId: 2, name: "Postres Especiales", order: 3, description: "Postres únicos y gourmet para ocasiones especiales." },
  { id: 30, categoryId: 3, name: "Desayunos", order: 1, description: "Opciones completas y deliciosas para el desayuno." },
  { id: 31, categoryId: 3, name: "Sándwiches", order: 2, description: "Sándwiches variados, frescos y llenadores." },
  { id: 32, categoryId: 3, name: "Ensaladas", order: 3, description: "Ensaladas frescas y saludables para todos los gustos." },
];

export const PRODUCTS: Product[] = [
  // Bebidas calientes
  { id: 100, subcategoryId: 10, name: "Espresso", price: 5500, order: 1, image: "assets/img/logo.png", description: "Café intenso y concentrado, ideal para despertar." },
  { id: 101, subcategoryId: 10, name: "Capuccino", price: 6500, order: 2, image: "assets/img/logo.png", description: "Café espresso con leche espumosa, cremoso y delicioso." },
  { id: 102, subcategoryId: 10, name: "Café Americano", price: 5000, order: 3, image: "assets/img/logo.png", description: "Café suave y alargado, perfecto para cualquier hora." },
  { id: 103, subcategoryId: 10, name: "Latte", price: 6800, order: 4, image: "assets/img/logo.png", description: "Café espresso con leche y espuma cremosa." },
  { id: 104, subcategoryId: 10, name: "Mocaccino", price: 7200, order: 5, image: "assets/img/logo.png", description: "Café con chocolate y leche, dulce y reconfortante." },
  { id: 105, subcategoryId: 10, name: "Café con Leche", price: 5800, order: 6, image: "assets/img/logo.png", description: "Clásico café con leche, equilibrado y suave." },
  { id: 106, subcategoryId: 10, name: "Macchiato", price: 6000, order: 7, image: "assets/img/logo.png", description: "Café espresso con un toque de leche espumosa." },
  { id: 107, subcategoryId: 10, name: "Chocolate Caliente", price: 6500, order: 8, image: "assets/img/logo.png", description: "Chocolate espeso y cremoso, ideal para días fríos." },
  { id: 108, subcategoryId: 10, name: "Chocolate Blanco", price: 7000, order: 9, image: "assets/img/logo.png", description: "Chocolate blanco caliente y dulce, para consentirse." },

  // Bebidas frías
  { id: 110, subcategoryId: 11, name: "Cold Brew", price: 7000, order: 1, image: "assets/img/logo.png", description: "Café frío infusionado lentamente, suave y refrescante." },
  { id: 111, subcategoryId: 11, name: "Limonada de Coco", price: 6000, order: 2, image: "assets/img/logo.png", description: "Limonada refrescante con un toque tropical de coco." },
  { id: 112, subcategoryId: 11, name: "Frappé de Café", price: 7500, order: 3, image: "assets/img/logo.png", description: "Bebida fría de café con hielo y espuma cremosa." },
  { id: 113, subcategoryId: 11, name: "Frappé de Chocolate", price: 7500, order: 4, image: "assets/img/logo.png", description: "Chocolate frío batido con hielo, dulce y refrescante." },
  { id: 114, subcategoryId: 11, name: "Limonada Natural", price: 5500, order: 5, image: "assets/img/logo.png", description: "Limonada fresca hecha con limones naturales." },
  { id: 115, subcategoryId: 11, name: "Limonada de Cereza", price: 6000, order: 6, image: "assets/img/logo.png", description: "Limonada natural con un toque dulce de cereza." },
  { id: 116, subcategoryId: 11, name: "Té Helado", price: 5800, order: 7, image: "assets/img/logo.png", description: "Té frío y refrescante, perfecto para el calor." },
  { id: 117, subcategoryId: 11, name: "Malteada de Vainilla", price: 8000, order: 8, image: "assets/img/logo.png", description: "Malteada cremosa de vainilla, deliciosa y suave." },
  { id: 118, subcategoryId: 11, name: "Malteada de Chocolate", price: 8000, order: 9, image: "assets/img/logo.png", description: "Malteada dulce de chocolate, perfecta para los golosos." },
  { id: 119, subcategoryId: 11, name: "Malteada de Fresa", price: 8000, order: 10, image: "assets/img/logo.png", description: "Malteada fresca de fresa, cremosa y natural." },

  // Té e Infusiones
  { id: 120, subcategoryId: 12, name: "Té Verde", price: 5000, order: 1, image: "assets/img/logo.png", description: "Té verde puro, aromático y saludable." },
  { id: 121, subcategoryId: 12, name: "Té Negro", price: 5000, order: 2, image: "assets/img/logo.png", description: "Té negro intenso y clásico." },
  { id: 122, subcategoryId: 12, name: "Té de Manzanilla", price: 4500, order: 3, image: "assets/img/logo.png", description: "Té suave de manzanilla, ideal para relajar." },
  { id: 123, subcategoryId: 12, name: "Té de Menta", price: 4500, order: 4, image: "assets/img/logo.png", description: "Infusión fresca de menta, refrescante y aromática." },
  { id: 124, subcategoryId: 12, name: "Té Chai", price: 5500, order: 5, image: "assets/img/logo.png", description: "Mezcla especiada de té negro con leche." },
  { id: 125, subcategoryId: 12, name: "Infusión de Jengibre", price: 5200, order: 6, image: "assets/img/logo.png", description: "Infusión picante y aromática de jengibre." },

  // Batidos
  { id: 130, subcategoryId: 13, name: "Batido de Fresa", price: 7500, order: 1, image: "assets/img/logo.png", description: "Batido cremoso de fresas naturales." },
  { id: 131, subcategoryId: 13, name: "Batido de Mango", price: 7500, order: 2, image: "assets/img/logo.png", description: "Batido dulce y fresco de mango." },
  { id: 132, subcategoryId: 13, name: "Batido de Banano", price: 7000, order: 3, image: "assets/img/logo.png", description: "Batido natural de banano, nutritivo." },
  { id: 133, subcategoryId: 13, name: "Batido Verde", price: 8000, order: 4, image: "assets/img/logo.png", description: "Batido saludable de vegetales y frutas." },
  { id: 134, subcategoryId: 13, name: "Batido de Frutos Rojos", price: 8200, order: 5, image: "assets/img/logo.png", description: "Batido de frutos rojos frescos y dulces." },
  { id: 135, subcategoryId: 13, name: "Batido Tropical", price: 8500, order: 6, image: "assets/img/logo.png", description: "Mezcla de frutas tropicales refrescante." },

  // Repostería
  { id: 200, subcategoryId: 20, name: "Cheesecake", price: 8500, order: 1, image: "assets/img/logo.png", description: "Pastel cremoso de queso con base crujiente." },
  { id: 201, subcategoryId: 20, name: "Brownie", price: 7000, order: 2, image: "assets/img/logo.png", description: "Brownie de chocolate denso y delicioso." },
  { id: 202, subcategoryId: 20, name: "Croissant", price: 5500, order: 3, image: "assets/img/logo.png", description: "Hojaldre francés, suave y mantecoso." },
  { id: 203, subcategoryId: 20, name: "Muffin de Arándanos", price: 6000, order: 4, image: "assets/img/logo.png", description: "Muffin esponjoso con arándanos naturales." },
  { id: 204, subcategoryId: 20, name: "Galletas con Chips", price: 4500, order: 5, image: "assets/img/logo.png", description: "Galletas dulces con trozos de chocolate." },
  { id: 205, subcategoryId: 20, name: "Torta de Zanahoria", price: 7500, order: 6, image: "assets/img/logo.png", description: "Pastel húmedo de zanahoria con especias." },
  { id: 206, subcategoryId: 20, name: "Pie de Manzana", price: 8000, order: 7, image: "assets/img/logo.png", description: "Tarta de manzana con canela y caramelo." },
  { id: 207, subcategoryId: 20, name: "Tiramisú", price: 9000, order: 8, image: "assets/img/logo.png", description: "Postre italiano con café y mascarpone." },
  { id: 208, subcategoryId: 20, name: "Éclair", price: 7200, order: 9, image: "assets/img/logo.png", description: "Pastelito relleno de crema y chocolate glaseado." },
  { id: 209, subcategoryId: 20, name: "Donas Glaseadas", price: 5000, order: 10, image: "assets/img/logo.png", description: "Donas dulces con cobertura brillante de azúcar." },

  // Helados
  { id: 210, subcategoryId: 21, name: "Helado de Vainilla", price: 6500, order: 1, image: "assets/img/logo.png", description: "Helado cremoso clásico de vainilla." },
  { id: 211, subcategoryId: 21, name: "Helado de Chocolate", price: 6500, order: 2, image: "assets/img/logo.png", description: "Helado intenso de chocolate oscuro." },
  { id: 212, subcategoryId: 21, name: "Helado de Fresa", price: 6500, order: 3, image: "assets/img/logo.png", description: "Helado de fresa natural, fresco y dulce." },
  { id: 213, subcategoryId: 21, name: "Helado de Menta", price: 7000, order: 4, image: "assets/img/logo.png", description: "Helado refrescante de menta con chocolate." },
  { id: 214, subcategoryId: 21, name: "Helado de Cookies", price: 7500, order: 5, image: "assets/img/logo.png", description: "Helado cremoso con trozos de galleta." },
  { id: 215, subcategoryId: 21, name: "Sundae", price: 8500, order: 6, image: "assets/img/logo.png", description: "Postre helado con sirope, crema y toppings." },

  // Postres Especiales
  { id: 220, subcategoryId: 22, name: "Waffle con Helado", price: 10000, order: 1, image: "assets/img/logo.png", description: "Waffle crujiente con helado y sirope." },
  { id: 221, subcategoryId: 22, name: "Crepe de Nutella", price: 9500, order: 2, image: "assets/img/logo.png", description: "Delicado crepe relleno de Nutella." },
  { id: 222, subcategoryId: 22, name: "Parfait de Yogurt", price: 8000, order: 3, image: "assets/img/logo.png", description: "Capas de yogurt, frutas y granola." },
  { id: 223, subcategoryId: 22, name: "Profiteroles", price: 9000, order: 4, image: "assets/img/logo.png", description: "Bollitos rellenos de crema y chocolate." },
  { id: 224, subcategoryId: 22, name: "Fondue de Chocolate", price: 12000, order: 5, image: "assets/img/logo.png", description: "Chocolate caliente para sumergir frutas y dulces." },

  // Desayunos
  { id: 300, subcategoryId: 30, name: "Tostadas Francesas", price: 8500, order: 1, image: "assets/img/logo.png", description: "Tostadas dulces con canela y miel." },
  { id: 301, subcategoryId: 30, name: "Pancakes", price: 9000, order: 2, image: "assets/img/logo.png", description: "Panqueques esponjosos con sirope y frutas." },
  { id: 302, subcategoryId: 30, name: "Huevos Revueltos", price: 7500, order: 3, image: "assets/img/logo.png", description: "Huevos batidos y cocidos a la perfección." },
  { id: 303, subcategoryId: 30, name: "Omelette", price: 8000, order: 4, image: "assets/img/logo.png", description: "Omelette con verduras y queso fundido." },
  { id: 304, subcategoryId: 30, name: "Granola con Yogurt", price: 7000, order: 5, image: "assets/img/logo.png", description: "Yogurt natural con granola y frutas frescas." }
];
