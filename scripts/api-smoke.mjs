import { spawn } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import assert from 'node:assert/strict'

const root = path.resolve(import.meta.dirname, '..')
const dbRelative = './server/data/scarlet-smoke.db'
const dbPath = path.resolve(root, dbRelative)
for (const suffix of ['', '-shm', '-wal']) fs.rmSync(`${dbPath}${suffix}`, { force: true })

const port = 8790
const base = `http://127.0.0.1:${port}/api`
const child = spawn(process.execPath, ['server/index.mjs'], {
  cwd: root,
  env: {
    ...process.env,
    PORT: String(port),
    DATABASE_PATH: dbRelative,
    JWT_SECRET: 'smoke-test-secret-that-is-never-used-in-production',
    ADMIN_EMAIL: 'smoke-admin@scarlet.test',
    ADMIN_PASSWORD: 'SmokeTestPassword!2026',
  },
  stdio: ['ignore', 'pipe', 'pipe'],
})
let logs = ''
child.stdout.on('data', (chunk) => { logs += chunk })
child.stderr.on('data', (chunk) => { logs += chunk })

async function json(pathname, init = {}) {
  const response = await fetch(`${base}${pathname}`, init)
  const body = await response.json().catch(() => ({}))
  return { response, body }
}

async function waitForServer() {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    try {
      const result = await fetch(`${base}/health`)
      if (result.ok) return
    } catch { /* wait */ }
    await new Promise((resolve) => setTimeout(resolve, 100))
  }
  throw new Error(`Smoke server did not start.\n${logs}`)
}

let passed = 0
function check(value, message) {
  assert.ok(value, message)
  passed += 1
  console.log(`✓ ${message}`)
}

try {
  await waitForServer()

  const catalogue = await json('/products?limit=100')
  check(catalogue.response.status === 200, 'catalogue endpoint responds')
  check(catalogue.body.products.length === 28, 'all 28 seed products load')
  check(catalogue.body.products.every((p) => p.name && Number.isInteger(p.price_pkr) && p.image_url), 'catalogue records contain names, integer PKR prices and images')
  check(catalogue.body.categories.length === 8, 'categories load with catalogue')

  const first = catalogue.body.products[0]
  const second = catalogue.body.products[1]
  const detail = await json(`/products/${first.slug}`)
  check(detail.response.status === 200 && detail.body.product.id === first.id, 'product detail endpoint and related products load')

  const orderPayload = {
    customer: {
      name: 'API Smoke Customer', email: 'smoke-customer@example.test', phone: '+92 300 9990011',
      address: '123 Smoke Test Street', city: 'Lahore', postalCode: '54000', notes: 'Automated smoke test',
    },
    shippingMethod: 'standard',
    paymentMethod: 'cash_on_delivery',
    // Any client-supplied names/prices would be ignored; only ids/quantities/config are accepted.
    items: [
      { type: 'product', productId: first.id, quantity: 2 },
      { type: 'necklace', positions: [{ instanceId: 'smoke-charm-1', productId: second.id, t: 0.55 }] },
    ],
  }
  const key = `smoke-${crypto.randomUUID()}`
  const created = await json('/orders', {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'Idempotency-Key': key }, body: JSON.stringify(orderPayload),
  })
  check(created.response.status === 201, 'order transaction records successfully')
  const expectedSubtotal = first.price_pkr * 2 + 1200 + second.price_pkr
  check(created.body.order.subtotal_pkr === expectedSubtotal, 'server recalculates authoritative product and chain prices')
  check(created.body.order.payment_status === 'unpaid' && created.body.payment.status === 'unpaid', 'cash-on-delivery remains explicitly unpaid')
  check(JSON.parse(created.body.order.items.find((item) => item.item_type === 'necklace').configuration_json).positions[0].t === 0.55, 'necklace configuration snapshot preserves charm position')

  const duplicate = await json('/orders', {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'Idempotency-Key': key }, body: JSON.stringify(orderPayload),
  })
  check(duplicate.response.status === 200 && duplicate.body.order.order_number === created.body.order.order_number, 'idempotency key prevents duplicate orders')

  const tracked = await json(`/orders/track?order=${created.body.order.order_number}&contact=${encodeURIComponent(orderPayload.customer.email)}`)
  check(tracked.response.status === 200 && tracked.body.order.items.length === 2, 'order tracking requires matching contact and returns snapshots')
  const deniedTrack = await json(`/orders/track?order=${created.body.order.order_number}&contact=wrong@example.test`)
  check(deniedTrack.response.status === 404, 'order tracking rejects a mismatched contact')

  const unauthorised = await json('/admin/stats')
  check(unauthorised.response.status === 401, 'admin API rejects unauthenticated access')
  const login = await json('/admin/login', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'smoke-admin@scarlet.test', password: 'SmokeTestPassword!2026' }),
  })
  check(login.response.status === 200 && login.body.token, 'administrator authentication issues a signed session token')
  const auth = { Authorization: `Bearer ${login.body.token}` }
  const stats = await json('/admin/stats', { headers: auth })
  check(stats.response.status === 200 && stats.body.stats.orderCount === 1, 'authorised dashboard receives order statistics')
  const adminProducts = await json('/admin/products', { headers: auth })
  const firstAfter = adminProducts.body.products.find((p) => p.id === first.id)
  check(firstAfter.stock_quantity === first.stock_quantity - 2, 'inventory decrements transactionally from direct product quantity')

  const category = await json('/admin/categories', {
    method: 'POST', headers: { ...auth, 'Content-Type': 'application/json' },
    body: JSON.stringify({ slug: 'smoke-category', name: 'Smoke Category', description: 'Temporary automated test category.' }),
  })
  check(category.response.status === 201 && category.body.category.slug === 'smoke-category', 'administrator can create catalogue categories')

  const settings = await json('/admin/settings', { headers: auth })
  check(settings.response.status === 200 && settings.body.settings.chain_base_price_pkr === 1200, 'protected store settings are readable by an administrator')

  const missingProduct = await json('/orders', {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'Idempotency-Key': `smoke-${crypto.randomUUID()}` },
    body: JSON.stringify({ ...orderPayload, items: [{ type: 'product', productId: 999999, quantity: 1 }] }),
  })
  check(missingProduct.response.status === 409, 'unavailable product produces a recoverable conflict response')

  console.log(`\n${passed} API acceptance checks passed.`)
} finally {
  child.kill('SIGTERM')
  await new Promise((resolve) => { child.once('exit', resolve); setTimeout(resolve, 1000) })
  for (const suffix of ['', '-shm', '-wal']) fs.rmSync(`${dbPath}${suffix}`, { force: true })
}
