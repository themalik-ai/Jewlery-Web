PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0,1)),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL REFERENCES categories(slug) ON UPDATE CASCADE,
  image_url TEXT NOT NULL,
  alt_text TEXT NOT NULL,
  price_pkr INTEGER NOT NULL CHECK (price_pkr >= 0),
  material TEXT NOT NULL DEFAULT 'Demo specification — verify before listing',
  finish TEXT NOT NULL DEFAULT 'Demo finish — verify before listing',
  stock_quantity INTEGER NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0,1)),
  is_featured INTEGER NOT NULL DEFAULT 0 CHECK (is_featured IN (0,1)),
  is_new INTEGER NOT NULL DEFAULT 0 CHECK (is_new IN (0,1)),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_active_featured ON products(is_active, is_featured);
CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  display_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin','staff','customer')),
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0,1)),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS carts (
  id TEXT PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','converted','abandoned')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS custom_necklace_designs (
  id TEXT PRIMARY KEY,
  cart_id TEXT REFERENCES carts(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  name TEXT NOT NULL DEFAULT 'Custom Charm Necklace',
  base_price_pkr INTEGER NOT NULL DEFAULT 0,
  configuration_json TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS necklace_design_charms (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  design_id TEXT NOT NULL REFERENCES custom_necklace_designs(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id),
  instance_id TEXT NOT NULL,
  position_t REAL NOT NULL CHECK (position_t >= 0 AND position_t <= 1),
  scale REAL NOT NULL DEFAULT 1,
  rotation REAL NOT NULL DEFAULT 0,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(design_id, instance_id)
);

CREATE TABLE IF NOT EXISTS cart_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  cart_id TEXT NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
  product_id INTEGER REFERENCES products(id),
  design_id TEXT REFERENCES custom_necklace_designs(id),
  item_type TEXT NOT NULL CHECK (item_type IN ('product','necklace')),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  CHECK ((item_type = 'product' AND product_id IS NOT NULL) OR (item_type = 'necklace' AND design_id IS NOT NULL))
);

CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_number TEXT NOT NULL UNIQUE,
  idempotency_key TEXT NOT NULL UNIQUE,
  customer_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  postal_code TEXT NOT NULL,
  notes TEXT,
  shipping_method TEXT NOT NULL CHECK (shipping_method IN ('standard','express','pickup')),
  payment_method TEXT NOT NULL CHECK (payment_method IN ('cash_on_delivery','bank_transfer')),
  payment_status TEXT NOT NULL DEFAULT 'unpaid' CHECK (payment_status IN ('pending','paid','failed','unpaid')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','confirmed','in_production','shipped','delivered','cancelled')),
  subtotal_pkr INTEGER NOT NULL CHECK (subtotal_pkr >= 0),
  shipping_pkr INTEGER NOT NULL CHECK (shipping_pkr >= 0),
  tax_pkr INTEGER NOT NULL CHECK (tax_pkr >= 0),
  total_pkr INTEGER NOT NULL CHECK (total_pkr >= 0),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_orders_email ON orders(email);
CREATE INDEX IF NOT EXISTS idx_orders_phone ON orders(phone);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at DESC);

CREATE TABLE IF NOT EXISTS order_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL CHECK (item_type IN ('product','necklace')),
  product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
  product_slug TEXT,
  name TEXT NOT NULL,
  image_url TEXT NOT NULL,
  unit_price_pkr INTEGER NOT NULL CHECK (unit_price_pkr >= 0),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  configuration_json TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  provider_reference TEXT,
  amount_pkr INTEGER NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending','paid','failed','refunded')),
  metadata_json TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS shipping_details (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL UNIQUE REFERENCES orders(id) ON DELETE CASCADE,
  recipient_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  postal_code TEXT NOT NULL,
  method TEXT NOT NULL,
  tracking_number TEXT,
  shipped_at TEXT,
  delivered_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  subscribed_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS contact_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new','read','resolved')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TRIGGER IF NOT EXISTS trg_products_updated
AFTER UPDATE ON products
BEGIN
  UPDATE products SET updated_at = datetime('now') WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS trg_orders_updated
AFTER UPDATE ON orders
BEGIN
  UPDATE orders SET updated_at = datetime('now') WHERE id = NEW.id;
END;
