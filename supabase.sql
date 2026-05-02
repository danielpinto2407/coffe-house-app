-- ================================================
-- COFFEE HOUSE APP - DATABASE SCHEMA
-- ================================================
-- Este script crea las tablas con relaciones foráneas correctas
-- Ejecuta esto en SQL Editor en Supabase

-- 1. TABLA: Categories (Categorías principales)
CREATE TABLE IF NOT EXISTS categories (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  "order" INT NOT NULL DEFAULT 999,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. TABLA: Subcategories (Subcategorías - pertenecen a una categoría)
CREATE TABLE IF NOT EXISTS subcategories (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  category_id BIGINT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  "order" INT NOT NULL DEFAULT 999,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(category_id, name)
);

-- 3. TABLA: Products (Productos - pertenecen a una subcategoría)
CREATE TABLE IF NOT EXISTS products (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  subcategory_id BIGINT NOT NULL REFERENCES subcategories(id) ON DELETE CASCADE,
  name VARCHAR(150) NOT NULL,
  price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
  description TEXT,
  image VARCHAR(500),
  "order" INT NOT NULL DEFAULT 999,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(subcategory_id, name)
);

-- 4. TABLA: Additions (Adiciones disponibles - Leche, Proteína, Toppings, etc.)
CREATE TABLE IF NOT EXISTS additions (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name VARCHAR(100) NOT NULL UNIQUE,
  price DECIMAL(10, 2) NOT NULL DEFAULT 0,
  "order" INT NOT NULL DEFAULT 999,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. TABLA: Product_Additions (Relación many-to-many: productos tienen múltiples adiciones)
CREATE TABLE IF NOT EXISTS product_additions (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  addition_id BIGINT NOT NULL REFERENCES additions(id) ON DELETE CASCADE,
  required BOOLEAN DEFAULT false, -- ¿Es obligatorio elegir una de esta adición?
  max_selections INT DEFAULT 1,   -- Máximo de selecciones de esta categoría
  "order" INT NOT NULL DEFAULT 999,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(product_id, addition_id)
);

-- ================================================
-- ÍNDICES PARA OPTIMIZACIÓN
-- ================================================
CREATE INDEX IF NOT EXISTS subcategories_category_id_idx ON subcategories(category_id);
CREATE INDEX IF NOT EXISTS products_subcategory_id_idx ON products(subcategory_id);
CREATE INDEX IF NOT EXISTS products_active_idx ON products(active);
CREATE INDEX IF NOT EXISTS additions_active_idx ON additions(active);
CREATE INDEX IF NOT EXISTS product_additions_product_id_idx ON product_additions(product_id);
CREATE INDEX IF NOT EXISTS product_additions_addition_id_idx ON product_additions(addition_id);
CREATE INDEX IF NOT EXISTS categories_order_idx ON categories("order");
CREATE INDEX IF NOT EXISTS subcategories_order_idx ON subcategories("order");
CREATE INDEX IF NOT EXISTS products_order_idx ON products("order");
CREATE INDEX IF NOT EXISTS additions_order_idx ON additions("order");
CREATE INDEX IF NOT EXISTS product_additions_order_idx ON product_additions("order");

-- ================================================
-- INSERTAR DATOS DE EJEMPLO
-- ================================================
INSERT INTO categories (name, description, "order") VALUES
  ('Bebidas', 'Refrescos, cafés y tés para cualquier momento del día.', 1),
  ('Postres', 'Delicias dulces para endulzar tu jornada.', 2),
  ('Alimentos', 'Comidas nutritivas y energéticas para tu día.', 3)
ON CONFLICT DO NOTHING;

INSERT INTO subcategories (category_id, name, description, "order") VALUES
  ((SELECT id FROM categories WHERE name = 'Bebidas'), 'Calientes', 'Cafés y chocolates calientes para empezar bien el día.', 1),
  ((SELECT id FROM categories WHERE name = 'Bebidas'), 'Frías', 'Refrescos y bebidas heladas para refrescarte.', 2),
  ((SELECT id FROM categories WHERE name = 'Postres'), 'Pasteles', 'Deliciosos pasteles caseros.', 1),
  ((SELECT id FROM categories WHERE name = 'Postres'), 'Galletas', 'Galletas crujientes y sabrosas.', 2),
  ((SELECT id FROM categories WHERE name = 'Alimentos'), 'Sándwiches', 'Sándwiches frescos y variados.', 1),
  ((SELECT id FROM categories WHERE name = 'Alimentos'), 'Ensaladas', 'Ensaladas saludables y nutritivas.', 2)
ON CONFLICT DO NOTHING;

INSERT INTO products (subcategory_id, name, price, description, "order") VALUES
  ((SELECT id FROM subcategories WHERE name = 'Calientes'), 'Cappuccino', 4.50, 'Espresso con leche vaporizada y crema', 1),
  ((SELECT id FROM subcategories WHERE name = 'Calientes'), 'Americano', 3.50, 'Espresso diluido en agua caliente', 2),
  ((SELECT id FROM subcategories WHERE name = 'Frías'), 'Iced Coffee', 4.00, 'Café frío con hielo y leche', 1),
  ((SELECT id FROM subcategories WHERE name = 'Frías'), 'Smoothie de Fresa', 5.00, 'Licuado natural de fresa dengan yogur', 2),
  ((SELECT id FROM subcategories WHERE name = 'Pasteles'), 'Brownies', 3.50, 'Brownies de chocolate caseros', 1),
  ((SELECT id FROM subcategories WHERE name = 'Pasteles'), 'Cheesecake', 5.50, 'Cheesecake con frutos rojos', 2)
ON CONFLICT DO NOTHING;

-- ================================================
-- INSERTAR ADICIONES
-- ================================================
INSERT INTO additions (name, price, "order") VALUES
  ('Agua', 0.00, 1),
  ('Leche', 0.50, 2),
  ('Leche de Almendra', 0.75, 3),
  ('Yogurt Griego', 1.00, 4),
  ('Proteína Whey', 2.00, 5),
  ('Colágeno', 1.50, 6),
  ('Proteína Vegana', 1.75, 7),
  ('Granola', 0.50, 8),
  ('Choco Chips', 0.40, 9),
  ('Miel', 0.30, 10),
  ('Frutos Rojos', 0.60, 11),
  ('Espuma Extra', 0.25, 12),
  ('Doble Shot', 0.75, 13)
ON CONFLICT DO NOTHING;

-- ================================================
-- ASOCIAR ADICIONES A PRODUCTOS (Product_Additions)
-- ================================================
-- Smoothie de Fresa - bases, proteínas y toppings
INSERT INTO product_additions (product_id, addition_id, required, max_selections, "order") VALUES
  -- Bases (obligatorio, máximo 1)
  ((SELECT id FROM products WHERE name = 'Smoothie de Fresa'), (SELECT id FROM additions WHERE name = 'Agua'), true, 1, 1),
  ((SELECT id FROM products WHERE name = 'Smoothie de Fresa'), (SELECT id FROM additions WHERE name = 'Leche'), true, 1, 2),
  ((SELECT id FROM products WHERE name = 'Smoothie de Fresa'), (SELECT id FROM additions WHERE name = 'Leche de Almendra'), true, 1, 3),
  ((SELECT id FROM products WHERE name = 'Smoothie de Fresa'), (SELECT id FROM additions WHERE name = 'Yogurt Griego'), true, 1, 4),
  
  -- Proteínas (opcional, máximo 1)
  ((SELECT id FROM products WHERE name = 'Smoothie de Fresa'), (SELECT id FROM additions WHERE name = 'Proteína Whey'), false, 1, 1),
  ((SELECT id FROM products WHERE name = 'Smoothie de Fresa'), (SELECT id FROM additions WHERE name = 'Colágeno'), false, 1, 2),
  ((SELECT id FROM products WHERE name = 'Smoothie de Fresa'), (SELECT id FROM additions WHERE name = 'Proteína Vegana'), false, 1, 3),
  
  -- Toppings (opcional, múltiples)
  ((SELECT id FROM products WHERE name = 'Smoothie de Fresa'), (SELECT id FROM additions WHERE name = 'Granola'), false, 99, 1),
  ((SELECT id FROM products WHERE name = 'Smoothie de Fresa'), (SELECT id FROM additions WHERE name = 'Choco Chips'), false, 99, 2),
  ((SELECT id FROM products WHERE name = 'Smoothie de Fresa'), (SELECT id FROM additions WHERE name = 'Miel'), false, 99, 3),
  ((SELECT id FROM products WHERE name = 'Smoothie de Fresa'), (SELECT id FROM additions WHERE name = 'Frutos Rojos'), false, 99, 4)
ON CONFLICT DO NOTHING;

-- Cappuccino - bases y extras
INSERT INTO product_additions (product_id, addition_id, required, max_selections, "order") VALUES
  -- Bases (obligatorio, máximo 1)
  ((SELECT id FROM products WHERE name = 'Cappuccino'), (SELECT id FROM additions WHERE name = 'Agua'), true, 1, 1),
  ((SELECT id FROM products WHERE name = 'Cappuccino'), (SELECT id FROM additions WHERE name = 'Leche'), true, 1, 2),
  
  -- Extras (opcional)
  ((SELECT id FROM products WHERE name = 'Cappuccino'), (SELECT id FROM additions WHERE name = 'Espuma Extra'), false, 1, 1),
  ((SELECT id FROM products WHERE name = 'Cappuccino'), (SELECT id FROM additions WHERE name = 'Doble Shot'), false, 1, 2)
ON CONFLICT DO NOTHING;

-- ================================================
-- NOTAS IMPORTANTES:
-- ================================================
-- 1. ON DELETE CASCADE: Si eliminas una categoría, se eliminan todas sus subcategorías
-- 2. ON DELETE CASCADE: Si eliminas una subcategoría, se eliminan todos sus productos
-- 3. Los campos de timestamp se actualizan automáticamente
-- 4. Los nombres de campos con camelCase (subcategoryId) se mapean a snake_case (subcategory_id) en la BD
-- 5. UNIQUE constraints evitan duplicados
-- ================================================
