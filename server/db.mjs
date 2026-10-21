import Database from 'better-sqlite3'
import bcrypt from 'bcryptjs'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { categories, products, settings } from './seed-data.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(__dirname, '..')
// Vercel Functions only expose /tmp as writable local storage. This makes the
// bundled SQLite backend usable for a visual/demo deployment, but /tmp is
// ephemeral and must not be treated as durable order storage. Configure a
// persistent external backend for a live store.
const defaultPath = process.env.VERCEL ? '/tmp/scarlet-demo.db' : './server/data/scarlet.db'
const configuredPath = process.env.DATABASE_PATH || defaultPath
const dbPath = path.isAbsolute(configuredPath) ? configuredPath : path.resolve(projectRoot, configuredPath)
fs.mkdirSync(path.dirname(dbPath), { recursive: true })

export const db = new Database(dbPath)
db.pragma('foreign_keys = ON')
db.pragma('journal_mode = WAL')
db.pragma('busy_timeout = 5000')

const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8')
db.exec(schema)

export function seedDatabase() {
  const seed = db.transaction(() => {
    const categoryCount = db.prepare('SELECT COUNT(*) AS count FROM categories').get().count
    if (categoryCount === 0) {
      const stmt = db.prepare(`
        INSERT INTO categories (slug, name, description, sort_order)
        VALUES (@slug, @name, @description, @sort)
      `)
      categories.forEach((category) => stmt.run(category))
    }

    const productCount = db.prepare('SELECT COUNT(*) AS count FROM products').get().count
    if (productCount === 0) {
      const stmt = db.prepare(`
        INSERT INTO products (
          slug, name, description, category, image_url, alt_text, price_pkr,
          material, finish, stock_quantity, is_active, is_featured, is_new
        ) VALUES (
          @slug, @name, @description, @category, @image_url, @alt_text, @price_pkr,
          @material, @finish, @stock_quantity, @is_active, @is_featured, @is_new
        )
      `)
      products.forEach((product) => stmt.run(product))
    }

    const settingStmt = db.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)')
    Object.entries(settings).forEach(([key, value]) => settingStmt.run(key, String(value)))

    const adminCount = db.prepare("SELECT COUNT(*) AS count FROM users WHERE role = 'admin'").get().count
    if (adminCount === 0) {
      const email = (process.env.ADMIN_EMAIL || 'admin@scarlet.demo').toLowerCase()
      const password = process.env.ADMIN_PASSWORD || 'ScarletDemo2026!'
      const hash = bcrypt.hashSync(password, 12)
      db.prepare(`
        INSERT INTO users (email, password_hash, display_name, role)
        VALUES (?, ?, 'SCARLET Administrator', 'admin')
      `).run(email, hash)
      if (process.env.NODE_ENV !== 'production') {
        console.log(`[seed] Development admin created: ${email}`)
        if (!process.env.ADMIN_PASSWORD) console.log('[seed] Using documented development-only password; set ADMIN_PASSWORD before deployment.')
      }
    }
  })
  seed()
}

seedDatabase()

export function publicSettings() {
  const rows = db.prepare('SELECT key, value FROM settings').all()
  const values = Object.fromEntries(rows.map((row) => [row.key, row.value]))
  return {
    announcement: values.announcement || '',
    chain_base_price_pkr: Number(values.chain_base_price_pkr || 0),
    standard_shipping_pkr: Number(values.standard_shipping_pkr || 0),
    express_shipping_pkr: Number(values.express_shipping_pkr || 0),
    free_shipping_threshold_pkr: Number(values.free_shipping_threshold_pkr || 0),
    tax_rate_pct: Number(values.tax_rate_pct || 0),
    whatsapp_number: values.whatsapp_number || '',
    store_email: values.store_email || '',
    store_phone: values.store_phone || '',
    store_address: values.store_address || '',
  }
}

export function normaliseProduct(row) {
  if (!row) return row
  return {
    ...row,
    is_active: Boolean(row.is_active),
    is_featured: Boolean(row.is_featured),
    is_new: Boolean(row.is_new),
  }
}

export function normaliseOrder(row) {
  if (!row) return row
  return row
}

export { dbPath }
