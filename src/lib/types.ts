export interface Category {
  slug: string
  name: string
  description?: string
}

export interface Product {
  id: number
  slug: string
  name: string
  description: string
  category: string
  image_url: string
  alt_text: string
  price_pkr: number
  material: string
  finish: string
  stock_quantity: number
  is_active: boolean
  is_featured: boolean
  is_new: boolean
  created_at: string
  updated_at: string
}

export interface CharmInstance {
  instanceId: string
  productId: number
  /** Normalised position along the necklace path, 0..1 */
  t: number
}

export interface NecklaceDesign {
  instances: CharmInstance[]
}

export interface NecklaceCharmSnapshot {
  productId: number
  slug: string
  name: string
  image: string
  unitPricePkr: number
  qty: number
  positions: number[]
}

export interface ProductCartLine {
  type: 'product'
  id: string
  productId: number
  slug: string
  name: string
  image: string
  unitPricePkr: number
  quantity: number
}

export interface NecklaceCartLine {
  type: 'necklace'
  id: 'custom-necklace'
  name: string
  image: string
  basePricePkr: number
  charms: NecklaceCharmSnapshot[]
  quantity: 1
  positions: { instanceId: string; productId: number; t: number }[]
}

export type CartLine = ProductCartLine | NecklaceCartLine

export interface CartTotals {
  subtotal: number
  shipping: number
  tax: number
  total: number
  itemCount: number
}

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'in_production'
  | 'shipped'
  | 'delivered'
  | 'cancelled'

export interface OrderItem {
  id: number
  type: 'product' | 'necklace'
  product_slug: string | null
  name: string
  image_url: string
  unit_price_pkr: number
  quantity: number
  configuration_json: string | null
}

export interface Order {
  id: number
  order_number: string
  customer_name: string
  email: string
  phone: string
  address: string
  city: string
  postal_code: string
  notes: string | null
  shipping_method: string
  payment_method: string
  payment_status: 'pending' | 'paid' | 'failed' | 'unpaid'
  status: OrderStatus
  subtotal_pkr: number
  shipping_pkr: number
  tax_pkr: number
  total_pkr: number
  created_at: string
  updated_at: string
  items?: OrderItem[]
}

export interface AdminUser {
  id: number
  email: string
  role: 'admin' | 'staff'
  display_name?: string
}

export interface PublicSettings {
  announcement: string
  chain_base_price_pkr: number
  standard_shipping_pkr: number
  express_shipping_pkr: number
  free_shipping_threshold_pkr: number
  tax_rate_pct: number
  whatsapp_number: string
  store_email: string
  store_phone: string
  store_address: string
}

export interface ApiError {
  error: string
  details?: Record<string, string>
}
