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

-- ================================================
-- ÍNDICES PARA OPTIMIZACIÓN
-- ================================================
CREATE INDEX IF NOT EXISTS subcategories_category_id_idx ON subcategories(category_id);
CREATE INDEX IF NOT EXISTS products_subcategory_id_idx ON products(subcategory_id);
CREATE INDEX IF NOT EXISTS products_active_idx ON products(active);
CREATE INDEX IF NOT EXISTS categories_order_idx ON categories("order");
CREATE INDEX IF NOT EXISTS subcategories_order_idx ON subcategories("order");
CREATE INDEX IF NOT EXISTS products_order_idx ON products("order");

-- ================================================
-- INSERTAR DATOS DE EJEMPLO
-- ================================================
INSERT INTO categories (name, description, "order") VALUES
  ('Bebidas', 'Refrescos, cafés y tés para cualquier momento del día.', 1),
  ('Postres', 'Delicias dulces para endulzar tu jornada.', 2),
  ('Alimentos', 'Comidas nutritivas y energéticas para tu día.', 3)
ON CONFLICT DO NOTHING;

INSERT INTO subcategories (category_id, name, description, "order") VALUES
  (1, 'Calientes', 'Cafés y chocolates calientes para empezar bien el día.', 1),
  (1, 'Frías', 'Refrescos y bebidas heladas para refrescarte.', 2),
  (2, 'Pasteles', 'Deliciosos pasteles caseros.', 1),
  (2, 'Galletas', 'Galletas crujientes y sabrosas.', 2),
  (3, 'Sándwiches', 'Sándwiches frescos y variados.', 1),
  (3, 'Ensaladas', 'Ensaladas saludables y nutritivas.', 2)
ON CONFLICT DO NOTHING;

INSERT INTO products (subcategory_id, name, price, description, "order") VALUES
  (1, 'Cappuccino', 4.50, 'Espresso con leche vaporizada y crema', 1),
  (1, 'Americano', 3.50, 'Espresso diluido en agua caliente', 2),
  (2, 'Iced Coffee', 4.00, 'Café frío con hielo y leche', 1),
  (2, 'Smoothie de Fresa', 5.00, 'Licuado natural de fresa dengan yogur', 2),
  (3, 'Brownies', 3.50, 'Brownies de chocolate caseros', 1),
  (3, 'Cheesecake', 5.50, 'Cheesecake con frutos rojos', 2)
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
