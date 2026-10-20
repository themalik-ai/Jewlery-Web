/**
 * SCARLET — single source of truth for brand & demo store configuration.
 *
 * The reference video did not accompany this build, so the brand name could not
 * be verified. "SCARLET" is a configurable placeholder: change BRAND_NAME here
 * (and the wordmark in components/layout/Logo.tsx) to re-brand the whole store.
 *
 * Any value marked DEMO is placeholder content. Nothing here claims to be a
 * real business, address, phone number or policy.
 */
export const STORE_CONFIG = {
  brandName: 'SCARLET',
  brandInitial: 'S',
  tagline: 'Charms & custom necklaces',
  eyebrow: 'The Charm Atelier',
  currency: 'PKR',
  currencySymbol: 'Rs',

  /** DEMO contact details — replace with verified business information. */
  demo: {
    email: 'hello@scarlet.example',
    phone: 'Not configured',
    addressLines: ['Not configured', 'Set verified details in Admin → Settings'],
    instagram: 'https://instagram.com/',
  },

  /**
   * WhatsApp is intentionally NOT pre-filled with an invented number.
   * Set the store's real number in Admin → Settings, or VITE_WHATSAPP_NUMBER.
   * Format: international, digits only, e.g. "923001234567".
   */
  whatsappNumber: (import.meta.env.VITE_WHATSAPP_NUMBER as string | undefined) ?? '',
  whatsappPrefill: 'Hi SCARLET! I would like some help with my charm necklace.',

  socials: [] as { label: string; href: string }[],

  /** Demo policies must be reviewed by the store owner before launch. */
  policyVersion: 'Demo draft v1.0',
} as const

export const DEFAULT_SETTINGS = {
  announcement: 'Hand-finished charms · Build your necklace online · Demo store',
  chain_base_price_pkr: 1200,
  standard_shipping_pkr: 250,
  express_shipping_pkr: 550,
  free_shipping_threshold_pkr: 5000,
  tax_rate_pct: 0,
  whatsapp_number: '',
  store_email: STORE_CONFIG.demo.email,
  store_phone: STORE_CONFIG.demo.phone,
  store_address: 'Not configured — set a verified address in Admin → Settings',
}

export type PublicSettings = typeof DEFAULT_SETTINGS

export const NAV_LINKS = [
  { label: 'Home', to: '/' },
  { label: 'Shop Charms', to: '/shop' },
  { label: 'Design Your Necklace', to: '/builder' },
  { label: 'About', to: '/about' },
  { label: 'Contact', to: '/contact' },
]

export function formatPKR(amount: number): string {
  const safe = Number.isFinite(amount) ? Math.round(amount) : 0
  return `Rs ${safe.toLocaleString('en-PK')}`
}

export function whatsappHref(number: string, prefill: string): string | null {
  const digits = (number || '').replace(/[^\d]/g, '')
  if (digits.length < 8) return null
  return `https://wa.me/${digits}?text=${encodeURIComponent(prefill)}`
}
