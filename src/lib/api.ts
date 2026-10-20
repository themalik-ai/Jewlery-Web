import type { Category, Order, Product, PublicSettings, AdminUser } from './types'

const BASE = '/api'

export class ApiRequestError extends Error {
  status: number
  details?: Record<string, string>
  constructor(message: string, status: number, details?: Record<string, string>) {
    super(message)
    this.status = status
    this.details = details
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response
  try {
    res = await fetch(`${BASE}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(init?.headers || {}),
      },
    })
  } catch {
    throw new ApiRequestError('We could not reach the store. Check your connection and try again.', 0)
  }
  let data: unknown = null
  const text = await res.text()
  if (text) {
    try {
      data = JSON.parse(text)
    } catch {
      data = null
    }
  }
  if (!res.ok) {
    const payload = data as { error?: string; details?: Record<string, string> } | null
    throw new ApiRequestError(payload?.error || 'Something went wrong. Please try again.', res.status, payload?.details)
  }
  return data as T
}

export const api = {
  products: (params: Record<string, string> = {}) => {
    const qs = new URLSearchParams(params).toString()
    return request<{ products: Product[]; total: number; categories: Category[] }>(`/products${qs ? `?${qs}` : ''}`)
  },
  product: (slug: string) => request<{ product: Product; related: Product[] }>(`/products/${slug}`),
  categories: () => request<{ categories: Category[] }>('/categories'),
  settings: () => request<PublicSettings>('/settings/public'),
  createOrder: (payload: unknown, idempotencyKey: string) =>
    request<{ order: Order; payment: { mode: string; status: string; message: string } }>('/orders', {
      method: 'POST',
      headers: { 'Idempotency-Key': idempotencyKey },
      body: JSON.stringify(payload),
    }),
  trackOrder: (orderNumber: string, contact: string) =>
    request<{ order: Order }>(`/orders/track?order=${encodeURIComponent(orderNumber)}&contact=${encodeURIComponent(contact)}`),
  newsletter: (email: string) => request<{ ok: true }>('/newsletter', { method: 'POST', body: JSON.stringify({ email }) }),
  contact: (payload: { name: string; email: string; message: string }) =>
    request<{ ok: true }>('/contact', { method: 'POST', body: JSON.stringify(payload) }),

  admin: {
    login: (email: string, password: string) =>
      request<{ token: string; user: AdminUser }>('/admin/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
    me: (token: string) => request<{ user: AdminUser }>('/admin/me', { headers: { Authorization: `Bearer ${token}` } }),
    stats: (token: string) =>
      request<{ stats: { productCount: number; orderCount: number; revenuePkr: number; lowStock: Product[] }; recentOrders: Order[] }>(
        '/admin/stats',
        { headers: { Authorization: `Bearer ${token}` } },
      ),
    products: (token: string) => request<{ products: Product[]; categories: Category[] }>('/admin/products', { headers: { Authorization: `Bearer ${token}` } }),
    saveProduct: (token: string, id: number | null, payload: Partial<Product>) =>
      request<{ product: Product }>(id ? `/admin/products/${id}` : '/admin/products', {
        method: id ? 'PUT' : 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      }),
    toggleProduct: (token: string, id: number, is_active: boolean) =>
      request<{ product: Product }>(`/admin/products/${id}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({ is_active }),
      }),
    uploadImage: async (token: string, file: File) => {
      const body = new FormData()
      body.append('image', file)
      let res: Response
      try {
        res = await fetch('/api/admin/upload', { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body })
      } catch {
        throw new ApiRequestError('Image upload could not reach the server.', 0)
      }
      const data = await res.json().catch(() => ({})) as { url?: string; error?: string }
      if (!res.ok || !data.url) throw new ApiRequestError(data.error || 'Image upload failed.', res.status)
      return { url: data.url }
    },
    saveCategory: (token: string, slug: string | null, payload: { slug: string; name: string; description: string }) =>
      request<{ category: Category }>(slug ? `/admin/categories/${slug}` : '/admin/categories', {
        method: slug ? 'PUT' : 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      }),
    orders: (token: string) => request<{ orders: Order[] }>('/admin/orders', { headers: { Authorization: `Bearer ${token}` } }),
    updateOrder: (token: string, id: number, payload: { status?: string; payment_status?: string }) =>
      request<{ order: Order }>(`/admin/orders/${id}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      }),
    settings: (token: string) => request<{ settings: PublicSettings }>('/admin/settings', { headers: { Authorization: `Bearer ${token}` } }),
    saveSettings: (token: string, payload: Partial<PublicSettings>) =>
      request<{ settings: PublicSettings }>('/admin/settings', {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      }),
  },
}
