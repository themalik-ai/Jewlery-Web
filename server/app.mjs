import express from 'express'
import cors from 'cors'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import multer from 'multer'
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { z } from 'zod'
import { db, normaliseProduct, publicSettings } from './db.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(__dirname, '..')
const isProduction = process.env.NODE_ENV === 'production'
const jwtSecret = process.env.JWT_SECRET || 'scarlet-development-secret-change-before-deploy'
// Public catalogue routes can still serve a demo when production secrets are
// missing, but administrator authentication stays disabled. This is safer than
// allowing known development credentials on a public deployment.
const adminAuthEnabled = !isProduction || Boolean(process.env.JWT_SECRET && process.env.ADMIN_PASSWORD)

if (isProduction && !adminAuthEnabled) {
  console.warn('Administrator authentication disabled: set JWT_SECRET and ADMIN_PASSWORD.')
}

const app = express()
app.disable('x-powered-by')
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  res.setHeader('Cross-Origin-Resource-Policy', 'same-origin')
  next()
})
app.use(cors({ origin: isProduction ? false : true, methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] }))
app.use(express.json({ limit: '512kb' }))

const uploadDir = process.env.VERCEL ? path.join('/tmp', 'scarlet-uploads') : path.join(__dirname, 'data', 'uploads')
fs.mkdirSync(uploadDir, { recursive: true })
app.use('/uploads', express.static(uploadDir, { maxAge: isProduction ? '30d' : 0, immutable: isProduction }))

function sendValidationError(res, error) {
  const details = {}
  for (const issue of error.issues || []) {
    details[issue.path.join('.') || 'form'] = issue.message
  }
  return res.status(400).json({ error: 'Please check the highlighted information.', details })
}

function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next)
}

/** Small in-process limiter suitable for this single-instance demo. Use a shared
 * store (Redis/platform limiter) for a horizontally-scaled deployment. */
const rateBuckets = new Map()
function rateLimit({ windowMs, max, name }) {
  return (req, res, next) => {
    const now = Date.now()
    const key = `${name}:${req.ip}`
    const current = rateBuckets.get(key)
    if (!current || now > current.resetAt) {
      rateBuckets.set(key, { count: 1, resetAt: now + windowMs })
      return next()
    }
    current.count += 1
    if (current.count > max) {
      res.setHeader('Retry-After', Math.ceil((current.resetAt - now) / 1000))
      return res.status(429).json({ error: 'Too many attempts. Please wait a moment and try again.' })
    }
    return next()
  }
}
setInterval(() => {
  const now = Date.now()
  for (const [key, bucket] of rateBuckets) if (now > bucket.resetAt) rateBuckets.delete(key)
}, 10 * 60 * 1000).unref()

function parseAuth(req, res, next) {
  if (!adminAuthEnabled) return res.status(503).json({ error: 'Administrator access is not configured for this deployment.' })
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, '')
  if (!token) return res.status(401).json({ error: 'Administrator sign-in required.' })
  try {
    const decoded = jwt.verify(token, jwtSecret)
    const user = db.prepare('SELECT id, email, display_name, role, is_active FROM users WHERE id = ?').get(decoded.sub)
    if (!user || !user.is_active || !['admin', 'staff'].includes(user.role)) {
      return res.status(403).json({ error: 'You do not have access to this area.' })
    }
    req.user = user
    next()
  } catch {
    return res.status(401).json({ error: 'Your administrator session has expired. Please sign in again.' })
  }
}

function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Administrator permission required.' })
  next()
}

app.get('/api/health', (_req, res) => res.json({ ok: true, mode: 'demo', paymentProvider: 'not_configured' }))

// --------------------------- Public catalogue ---------------------------

app.get('/api/categories', (_req, res) => {
  const rows = db.prepare(`
    SELECT slug, name, description
    FROM categories WHERE is_active = 1 ORDER BY sort_order, name
  `).all()
  res.json({ categories: rows })
})

app.get('/api/products', (req, res) => {
  const search = String(req.query.search || '').trim().slice(0, 80)
  const category = String(req.query.category || '').trim().slice(0, 80)
  const featured = req.query.featured === 'true'
  const newest = req.query.new === 'true'
  const limit = Math.min(Math.max(Number(req.query.limit || 60), 1), 100)
  const offset = Math.max(Number(req.query.offset || 0), 0)
  const sortMap = {
    'name-asc': 'name COLLATE NOCASE ASC',
    'name-desc': 'name COLLATE NOCASE DESC',
    'price-asc': 'price_pkr ASC, name ASC',
    'price-desc': 'price_pkr DESC, name ASC',
    newest: 'is_new DESC, created_at DESC, id DESC',
    featured: 'is_featured DESC, name ASC',
  }
  const orderBy = sortMap[String(req.query.sort || '')] || 'is_featured DESC, id ASC'

  const where = ['is_active = 1']
  const params = {}
  if (search) {
    where.push('(name LIKE @search OR description LIKE @search)')
    params.search = `%${search.replace(/[%_]/g, '\\$&')}%`
  }
  if (category && category !== 'all') {
    where.push('category = @category')
    params.category = category
  }
  if (featured) where.push('is_featured = 1')
  if (newest) where.push('is_new = 1')

  const whereSql = where.join(' AND ')
  const total = db.prepare(`SELECT COUNT(*) AS count FROM products WHERE ${whereSql}`).get(params).count
  const rows = db.prepare(`
    SELECT * FROM products WHERE ${whereSql}
    ORDER BY ${orderBy} LIMIT @limit OFFSET @offset
  `).all({ ...params, limit, offset }).map(normaliseProduct)
  const categories = db.prepare(`
    SELECT slug, name, description FROM categories WHERE is_active = 1 ORDER BY sort_order, name
  `).all()
  res.json({ products: rows, total, categories })
})

app.get('/api/products/:slug', (req, res) => {
  const product = db.prepare('SELECT * FROM products WHERE slug = ? AND is_active = 1').get(req.params.slug)
  if (!product) return res.status(404).json({ error: 'This charm could not be found or is no longer available.' })
  const related = db.prepare(`
    SELECT * FROM products
    WHERE category = ? AND id != ? AND is_active = 1
    ORDER BY is_featured DESC, id ASC LIMIT 4
  `).all(product.category, product.id).map(normaliseProduct)
  res.json({ product: normaliseProduct(product), related })
})

app.get('/api/settings/public', (_req, res) => res.json(publicSettings()))

// ----------------------------- Order flow ------------------------------

const customerSchema = z.object({
  name: z.string().trim().min(2, 'Enter your full name.').max(100),
  email: z.string().trim().email('Enter a valid email address.').max(160),
  phone: z.string().trim().min(7, 'Enter a valid phone number.').max(30),
  address: z.string().trim().min(8, 'Enter a complete delivery address.').max(300),
  city: z.string().trim().min(2, 'Enter your city.').max(80),
  postalCode: z.string().trim().min(3, 'Enter a postal code.').max(20),
  notes: z.string().trim().max(500).optional().default(''),
})

const productItemSchema = z.object({
  type: z.literal('product'),
  productId: z.number().int().positive(),
  quantity: z.number().int().min(1).max(20),
})

const positionSchema = z.object({
  instanceId: z.string().trim().min(3).max(100),
  productId: z.number().int().positive(),
  t: z.number().min(0.04).max(0.96),
})

const necklaceItemSchema = z.object({
  type: z.literal('necklace'),
  positions: z.array(positionSchema).min(1, 'A custom necklace needs at least one charm.').max(24),
})

const orderSchema = z.object({
  customer: customerSchema,
  shippingMethod: z.enum(['standard', 'express', 'pickup']),
  paymentMethod: z.enum(['cash_on_delivery', 'bank_transfer']),
  items: z.array(z.discriminatedUnion('type', [productItemSchema, necklaceItemSchema])).min(1).max(40),
})

function fullOrder(id) {
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id)
  if (!order) return null
  order.items = db.prepare('SELECT * FROM order_items WHERE order_id = ? ORDER BY id').all(id)
  return order
}

function makeOrderNumber() {
  const date = new Date()
  const ymd = [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('')
  for (let i = 0; i < 10; i += 1) {
    const code = crypto.randomInt(0, 36 ** 4).toString(36).toUpperCase().padStart(4, '0')
    const number = `SC-${ymd}-${code}`
    if (!db.prepare('SELECT 1 FROM orders WHERE order_number = ?').get(number)) return number
  }
  return `SC-${ymd}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`
}

app.post('/api/orders', rateLimit({ windowMs: 10 * 60 * 1000, max: 12, name: 'orders' }), (req, res) => {
  const parsed = orderSchema.safeParse(req.body)
  if (!parsed.success) return sendValidationError(res, parsed.error)

  const idempotencyKey = String(req.headers['idempotency-key'] || '').trim()
  if (idempotencyKey.length < 12 || idempotencyKey.length > 100) {
    return res.status(400).json({ error: 'A valid checkout request key is required. Please refresh checkout and try again.' })
  }
  const previous = db.prepare('SELECT id FROM orders WHERE idempotency_key = ?').get(idempotencyKey)
  if (previous) {
    return res.json({
      order: fullOrder(previous.id),
      payment: { mode: 'offline', status: 'not_processed_online', message: 'This order was already recorded; no duplicate was created.' },
    })
  }

  const { customer, shippingMethod, paymentMethod, items } = parsed.data
  const settings = publicSettings()
  const requestedIds = new Set()
  for (const item of items) {
    if (item.type === 'product') requestedIds.add(item.productId)
    else item.positions.forEach((position) => requestedIds.add(position.productId))
  }
  const ids = [...requestedIds]
  const placeholders = ids.map(() => '?').join(',')
  const productRows = ids.length ? db.prepare(`SELECT * FROM products WHERE id IN (${placeholders})`).all(...ids) : []
  const productMap = new Map(productRows.map((product) => [product.id, product]))

  for (const id of ids) {
    const product = productMap.get(id)
    if (!product || !product.is_active) {
      return res.status(409).json({ error: 'One of the selected charms is no longer available. Please review your cart.' })
    }
  }

  const directQuantities = new Map()
  let necklace = null
  for (const item of items) {
    if (item.type === 'product') {
      directQuantities.set(item.productId, (directQuantities.get(item.productId) || 0) + item.quantity)
    } else {
      if (necklace) return res.status(400).json({ error: 'Only one custom necklace configuration can be checked out at a time.' })
      necklace = item
    }
  }

  const inventoryDemand = new Map(directQuantities)
  if (necklace) {
    for (const position of necklace.positions) {
      inventoryDemand.set(position.productId, (inventoryDemand.get(position.productId) || 0) + 1)
    }
  }
  for (const [productId, qty] of inventoryDemand) {
    const product = productMap.get(productId)
    if (product.stock_quantity < qty) {
      return res.status(409).json({
        error: `${product.name} has only ${product.stock_quantity} available. Please update your quantity.`,
      })
    }
  }

  const directLines = [...directQuantities].map(([productId, quantity]) => {
    const product = productMap.get(productId)
    return { product, quantity, lineTotal: product.price_pkr * quantity }
  })

  let necklaceSnapshot = null
  let necklacePrice = 0
  if (necklace) {
    const quantities = new Map()
    for (const position of necklace.positions) quantities.set(position.productId, (quantities.get(position.productId) || 0) + 1)
    const charms = [...quantities].map(([productId, quantity]) => {
      const product = productMap.get(productId)
      return {
        productId,
        slug: product.slug,
        name: product.name,
        image: product.image_url,
        unitPricePkr: product.price_pkr,
        quantity,
      }
    })
    necklacePrice = settings.chain_base_price_pkr + charms.reduce((sum, charm) => sum + charm.unitPricePkr * charm.quantity, 0)
    necklaceSnapshot = {
      version: 1,
      chain: { name: 'SCARLET Custom Chain', unitPricePkr: settings.chain_base_price_pkr },
      charms,
      positions: necklace.positions,
    }
  }

  const subtotal = directLines.reduce((sum, line) => sum + line.lineTotal, 0) + necklacePrice
  if (subtotal <= 0) return res.status(400).json({ error: 'Your cart does not contain a purchasable item.' })
  let shipping = 0
  if (shippingMethod === 'standard') {
    shipping = subtotal >= settings.free_shipping_threshold_pkr ? 0 : settings.standard_shipping_pkr
  } else if (shippingMethod === 'express') {
    shipping = settings.express_shipping_pkr
  }
  const tax = Math.round(((subtotal + shipping) * settings.tax_rate_pct) / 100)
  const total = subtotal + shipping + tax
  const orderNumber = makeOrderNumber()

  let orderId
  try {
    const createOrder = db.transaction(() => {
      const result = db.prepare(`
        INSERT INTO orders (
          order_number, idempotency_key, customer_name, email, phone, address, city, postal_code,
          notes, shipping_method, payment_method, payment_status, status,
          subtotal_pkr, shipping_pkr, tax_pkr, total_pkr
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?, ?)
      `).run(
        orderNumber,
        idempotencyKey,
        customer.name,
        customer.email.toLowerCase(),
        customer.phone,
        customer.address,
        customer.city,
        customer.postalCode,
        customer.notes || null,
        shippingMethod,
        paymentMethod,
        paymentMethod === 'bank_transfer' ? 'pending' : 'unpaid',
        subtotal,
        shipping,
        tax,
        total,
      )
      orderId = Number(result.lastInsertRowid)

      const insertItem = db.prepare(`
        INSERT INTO order_items (
          order_id, item_type, product_id, product_slug, name, image_url,
          unit_price_pkr, quantity, configuration_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      for (const line of directLines) {
        insertItem.run(
          orderId,
          'product',
          line.product.id,
          line.product.slug,
          line.product.name,
          line.product.image_url,
          line.product.price_pkr,
          line.quantity,
          null,
        )
      }
      if (necklaceSnapshot) {
        insertItem.run(
          orderId,
          'necklace',
          null,
          null,
          'Custom Charm Necklace',
          '/logo-mark.svg',
          necklacePrice,
          1,
          JSON.stringify(necklaceSnapshot),
        )
      }

      db.prepare(`
        INSERT INTO shipping_details (order_id, recipient_name, phone, address, city, postal_code, method)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(orderId, customer.name, customer.phone, customer.address, customer.city, customer.postalCode, shippingMethod)

      db.prepare(`
        INSERT INTO payments (order_id, provider, amount_pkr, status, metadata_json)
        VALUES (?, 'offline', ?, 'pending', ?)
      `).run(orderId, total, JSON.stringify({ paymentMethod, onlinePaymentProcessed: false }))

      const decrement = db.prepare('UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ? AND stock_quantity >= ?')
      for (const [productId, qty] of inventoryDemand) {
        const result = decrement.run(qty, productId, qty)
        if (result.changes !== 1) throw new Error('Stock changed while the order was being placed.')
      }
    })
    createOrder()
  } catch (error) {
    if (String(error.message).includes('UNIQUE constraint failed: orders.idempotency_key')) {
      const existing = db.prepare('SELECT id FROM orders WHERE idempotency_key = ?').get(idempotencyKey)
      return res.json({
        order: fullOrder(existing.id),
        payment: { mode: 'offline', status: 'not_processed_online', message: 'This order was already recorded; no duplicate was created.' },
      })
    }
    console.error('Order transaction failed:', error)
    return res.status(409).json({ error: 'The order could not be completed because inventory changed. Please review your cart and try again.' })
  }

  const message = paymentMethod === 'cash_on_delivery'
    ? 'Order recorded for cash on delivery. No online payment was processed.'
    : 'Order recorded with payment pending. Bank-transfer instructions must be supplied and verified by the store owner; no online payment was processed.'
  return res.status(201).json({
    order: fullOrder(orderId),
    payment: { mode: 'offline', status: paymentMethod === 'cash_on_delivery' ? 'unpaid' : 'pending', message },
  })
})

app.get('/api/orders/track', rateLimit({ windowMs: 10 * 60 * 1000, max: 30, name: 'track' }), (req, res) => {
  const orderNumber = String(req.query.order || '').trim().toUpperCase()
  const contact = String(req.query.contact || '').trim().toLowerCase()
  if (!orderNumber || contact.length < 5) return res.status(400).json({ error: 'Enter your order number and the email or phone used at checkout.' })
  const row = db.prepare(`
    SELECT id FROM orders
    WHERE order_number = ? AND (lower(email) = ? OR lower(replace(replace(phone, ' ', ''), '-', '')) = replace(replace(?, ' ', ''), '-', ''))
  `).get(orderNumber, contact, contact)
  if (!row) return res.status(404).json({ error: 'We could not match that order and contact detail.' })
  res.json({ order: fullOrder(row.id) })
})

const emailSchema = z.object({ email: z.string().trim().email().max(160) })
app.post('/api/newsletter', rateLimit({ windowMs: 60 * 60 * 1000, max: 8, name: 'newsletter' }), (req, res) => {
  const parsed = emailSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: 'Enter a valid email address.' })
  db.prepare('INSERT OR IGNORE INTO newsletter_subscribers (email) VALUES (?)').run(parsed.data.email.toLowerCase())
  res.status(201).json({ ok: true })
})

const contactSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(160),
  message: z.string().trim().min(10).max(2000),
})
app.post('/api/contact', rateLimit({ windowMs: 60 * 60 * 1000, max: 10, name: 'contact' }), (req, res) => {
  const parsed = contactSchema.safeParse(req.body)
  if (!parsed.success) return sendValidationError(res, parsed.error)
  db.prepare('INSERT INTO contact_messages (name, email, message) VALUES (?, ?, ?)').run(
    parsed.data.name,
    parsed.data.email.toLowerCase(),
    parsed.data.message,
  )
  res.status(201).json({ ok: true })
})

// ---------------------------- Admin API -------------------------------

app.post('/api/admin/login', rateLimit({ windowMs: 15 * 60 * 1000, max: 8, name: 'admin-login' }), asyncHandler(async (req, res) => {
  if (!adminAuthEnabled) return res.status(503).json({ error: 'Administrator access is not configured. Set JWT_SECRET and ADMIN_PASSWORD in the deployment environment.' })
  const parsed = z.object({ email: z.string().email(), password: z.string().min(8).max(200) }).safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: 'Enter a valid administrator email and password.' })
  const user = db.prepare('SELECT * FROM users WHERE lower(email) = lower(?) AND is_active = 1').get(parsed.data.email)
  // Always perform a hash comparison to reduce timing differences.
  const fallback = '$2a$12$zbVxttxUyEnn.kGuYn9FOudFmSFhFwRi/MHMx0tVQQKvnnSkXp81e'
  const valid = await bcrypt.compare(parsed.data.password, user?.password_hash || fallback)
  if (!user || !valid || !['admin', 'staff'].includes(user.role)) {
    return res.status(401).json({ error: 'Incorrect administrator credentials.' })
  }
  const token = jwt.sign({ sub: String(user.id), role: user.role }, jwtSecret, { expiresIn: '8h', issuer: 'scarlet-store' })
  res.json({ token, user: { id: user.id, email: user.email, role: user.role, display_name: user.display_name } })
}))

app.get('/api/admin/me', parseAuth, (req, res) => {
  res.json({ user: { id: req.user.id, email: req.user.email, role: req.user.role, display_name: req.user.display_name } })
})

app.get('/api/admin/stats', parseAuth, (_req, res) => {
  const productCount = db.prepare('SELECT COUNT(*) AS count FROM products WHERE is_active = 1').get().count
  const orderCount = db.prepare("SELECT COUNT(*) AS count FROM orders WHERE status != 'cancelled'").get().count
  const revenuePkr = db.prepare("SELECT COALESCE(SUM(total_pkr), 0) AS total FROM orders WHERE status != 'cancelled'").get().total
  const lowStock = db.prepare('SELECT * FROM products WHERE is_active = 1 AND stock_quantity <= 5 ORDER BY stock_quantity, name LIMIT 8').all().map(normaliseProduct)
  const recentOrders = db.prepare('SELECT * FROM orders ORDER BY created_at DESC, id DESC LIMIT 8').all()
  res.json({ stats: { productCount, orderCount, revenuePkr, lowStock }, recentOrders })
})

app.get('/api/admin/products', parseAuth, (_req, res) => {
  const rows = db.prepare('SELECT * FROM products ORDER BY is_active DESC, name').all().map(normaliseProduct)
  const categories = db.prepare('SELECT slug, name, description FROM categories ORDER BY sort_order, name').all()
  res.json({ products: rows, categories })
})

const productSchema = z.object({
  slug: z.string().trim().min(2).max(100).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use lowercase letters, numbers and hyphens.'),
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().min(10).max(1500),
  category: z.string().trim().min(2).max(80),
  image_url: z.string().trim().min(1).max(500),
  alt_text: z.string().trim().min(3).max(200),
  price_pkr: z.number().int().min(0).max(10_000_000),
  material: z.string().trim().min(2).max(300),
  finish: z.string().trim().min(2).max(300),
  stock_quantity: z.number().int().min(0).max(1_000_000),
  is_active: z.boolean(),
  is_featured: z.boolean(),
  is_new: z.boolean(),
})

app.post('/api/admin/products', parseAuth, requireAdmin, (req, res) => {
  const parsed = productSchema.safeParse(req.body)
  if (!parsed.success) return sendValidationError(res, parsed.error)
  const p = parsed.data
  try {
    const result = db.prepare(`
      INSERT INTO products (
        slug, name, description, category, image_url, alt_text, price_pkr,
        material, finish, stock_quantity, is_active, is_featured, is_new
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(p.slug, p.name, p.description, p.category, p.image_url, p.alt_text, p.price_pkr, p.material, p.finish, p.stock_quantity, +p.is_active, +p.is_featured, +p.is_new)
    res.status(201).json({ product: normaliseProduct(db.prepare('SELECT * FROM products WHERE id = ?').get(result.lastInsertRowid)) })
  } catch (error) {
    if (String(error.message).includes('UNIQUE')) return res.status(409).json({ error: 'A product already uses that slug.' })
    if (String(error.message).includes('FOREIGN KEY')) return res.status(400).json({ error: 'Choose a valid category.' })
    throw error
  }
})

app.put('/api/admin/products/:id', parseAuth, requireAdmin, (req, res) => {
  const id = Number(req.params.id)
  const existing = db.prepare('SELECT * FROM products WHERE id = ?').get(id)
  if (!existing) return res.status(404).json({ error: 'Product not found.' })
  const merged = {
    ...normaliseProduct(existing),
    ...req.body,
    price_pkr: req.body.price_pkr ?? existing.price_pkr,
    stock_quantity: req.body.stock_quantity ?? existing.stock_quantity,
  }
  const parsed = productSchema.safeParse(merged)
  if (!parsed.success) return sendValidationError(res, parsed.error)
  const p = parsed.data
  try {
    db.prepare(`
      UPDATE products SET
        slug = ?, name = ?, description = ?, category = ?, image_url = ?, alt_text = ?,
        price_pkr = ?, material = ?, finish = ?, stock_quantity = ?,
        is_active = ?, is_featured = ?, is_new = ?
      WHERE id = ?
    `).run(p.slug, p.name, p.description, p.category, p.image_url, p.alt_text, p.price_pkr, p.material, p.finish, p.stock_quantity, +p.is_active, +p.is_featured, +p.is_new, id)
    res.json({ product: normaliseProduct(db.prepare('SELECT * FROM products WHERE id = ?').get(id)) })
  } catch (error) {
    if (String(error.message).includes('UNIQUE')) return res.status(409).json({ error: 'A product already uses that slug.' })
    throw error
  }
})

const categorySchema = z.object({
  slug: z.string().trim().min(2).max(80).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use lowercase letters, numbers and hyphens.'),
  name: z.string().trim().min(2).max(100),
  description: z.string().trim().max(500).default(''),
})

app.post('/api/admin/categories', parseAuth, requireAdmin, (req, res) => {
  const parsed = categorySchema.safeParse(req.body)
  if (!parsed.success) return sendValidationError(res, parsed.error)
  try {
    const max = db.prepare('SELECT COALESCE(MAX(sort_order), 0) AS value FROM categories').get().value
    db.prepare('INSERT INTO categories (slug, name, description, sort_order) VALUES (?, ?, ?, ?)').run(
      parsed.data.slug, parsed.data.name, parsed.data.description, max + 1,
    )
    const category = db.prepare('SELECT slug, name, description FROM categories WHERE slug = ?').get(parsed.data.slug)
    res.status(201).json({ category })
  } catch (error) {
    if (String(error.message).includes('UNIQUE')) return res.status(409).json({ error: 'A category already uses that slug.' })
    throw error
  }
})

app.put('/api/admin/categories/:slug', parseAuth, requireAdmin, (req, res) => {
  const existing = db.prepare('SELECT * FROM categories WHERE slug = ?').get(req.params.slug)
  if (!existing) return res.status(404).json({ error: 'Category not found.' })
  const parsed = categorySchema.safeParse({ ...existing, ...req.body })
  if (!parsed.success) return sendValidationError(res, parsed.error)
  try {
    const update = db.transaction(() => {
      // ON UPDATE CASCADE preserves product assignments if the slug changes.
      db.prepare('UPDATE categories SET slug = ?, name = ?, description = ?, updated_at = datetime(\'now\') WHERE slug = ?').run(
        parsed.data.slug, parsed.data.name, parsed.data.description, req.params.slug,
      )
    })
    update()
    const category = db.prepare('SELECT slug, name, description FROM categories WHERE slug = ?').get(parsed.data.slug)
    res.json({ category })
  } catch (error) {
    if (String(error.message).includes('UNIQUE')) return res.status(409).json({ error: 'A category already uses that slug.' })
    throw error
  }
})

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase()
    cb(null, `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext}`)
  },
})
const upload = multer({
  storage,
  limits: { fileSize: 3 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    // SVG uploads are intentionally excluded: unsanitised SVG can execute active
    // content when served from the store origin. Built-in reviewed SVG assets are
    // bundled at build time; administrators may upload PNG, JPEG or WebP only.
    const allowed = ['image/png', 'image/jpeg', 'image/webp']
    cb(null, allowed.includes(file.mimetype))
  },
})
app.post('/api/admin/upload', parseAuth, requireAdmin, upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Choose a PNG, JPEG or WebP image under 3 MB.' })
  res.status(201).json({ url: `/uploads/${req.file.filename}` })
})

app.get('/api/admin/orders', parseAuth, (_req, res) => {
  const orders = db.prepare('SELECT * FROM orders ORDER BY created_at DESC, id DESC LIMIT 250').all()
  for (const order of orders) order.items = db.prepare('SELECT * FROM order_items WHERE order_id = ? ORDER BY id').all(order.id)
  res.json({ orders })
})

app.patch('/api/admin/orders/:id', parseAuth, (req, res) => {
  const id = Number(req.params.id)
  const parsed = z.object({
    status: z.enum(['pending', 'confirmed', 'in_production', 'shipped', 'delivered', 'cancelled']).optional(),
    payment_status: z.enum(['pending', 'paid', 'failed', 'unpaid']).optional(),
  }).refine((value) => value.status || value.payment_status, 'Provide a status update.').safeParse(req.body)
  if (!parsed.success) return sendValidationError(res, parsed.error)
  const existing = db.prepare('SELECT * FROM orders WHERE id = ?').get(id)
  if (!existing) return res.status(404).json({ error: 'Order not found.' })
  db.prepare('UPDATE orders SET status = ?, payment_status = ? WHERE id = ?').run(
    parsed.data.status || existing.status,
    parsed.data.payment_status || existing.payment_status,
    id,
  )
  if (parsed.data.payment_status) {
    db.prepare('UPDATE payments SET status = ? WHERE order_id = ?').run(
      parsed.data.payment_status === 'unpaid' ? 'pending' : parsed.data.payment_status,
      id,
    )
  }
  res.json({ order: fullOrder(id) })
})

app.get('/api/admin/settings', parseAuth, requireAdmin, (_req, res) => res.json({ settings: publicSettings() }))

const settingsSchema = z.object({
  announcement: z.string().trim().max(200).optional(),
  chain_base_price_pkr: z.number().int().min(0).max(10_000_000).optional(),
  standard_shipping_pkr: z.number().int().min(0).max(1_000_000).optional(),
  express_shipping_pkr: z.number().int().min(0).max(1_000_000).optional(),
  free_shipping_threshold_pkr: z.number().int().min(0).max(10_000_000).optional(),
  tax_rate_pct: z.number().min(0).max(100).optional(),
  whatsapp_number: z.string().trim().max(30).optional(),
  store_email: z.string().trim().email().max(160).optional(),
  store_phone: z.string().trim().max(30).optional(),
  store_address: z.string().trim().max(300).optional(),
})
app.put('/api/admin/settings', parseAuth, requireAdmin, (req, res) => {
  const parsed = settingsSchema.safeParse(req.body)
  if (!parsed.success) return sendValidationError(res, parsed.error)
  const upsert = db.prepare(`
    INSERT INTO settings (key, value) VALUES (?, ?)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')
  `)
  const update = db.transaction(() => Object.entries(parsed.data).forEach(([key, value]) => upsert.run(key, String(value))))
  update()
  res.json({ settings: publicSettings() })
})

// Error middleware — do not leak internals to clients.
app.use((error, _req, res, _next) => {
  if (error instanceof multer.MulterError) {
    return res.status(400).json({ error: error.code === 'LIMIT_FILE_SIZE' ? 'Image must be smaller than 3 MB.' : 'The image could not be uploaded.' })
  }
  console.error(error)
  res.status(500).json({ error: 'An unexpected server error occurred. Please try again.' })
})

if (process.argv.includes('--serve-dist')) {
  const dist = path.join(projectRoot, 'dist')
  app.use(express.static(dist, { maxAge: '1d' }))
  app.get('*', (_req, res) => res.sendFile(path.join(dist, 'index.html')))
}

export default app
