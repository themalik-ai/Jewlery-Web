import { FormEvent, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Instagram, Mail } from 'lucide-react'
import { api } from '../../lib/api'
import { useUiStore } from '../../store/uiStore'
import { useSettingsStore } from '../../store/settingsStore'
import { Logo } from './Logo'

const groups = [
  {
    title: 'Discover',
    links: [
      ['Shop all charms', '/shop'],
      ['Design your necklace', '/builder'],
      ['New arrivals', '/shop?sort=newest'],
      ['About SCARLET', '/about'],
    ],
  },
  {
    title: 'Help',
    links: [
      ['Contact us', '/contact'],
      ['Frequently asked', '/faq'],
      ['Shipping & delivery', '/shipping'],
      ['Returns & refunds', '/returns'],
      ['Track an order', '/track-order'],
    ],
  },
  {
    title: 'Legal',
    links: [
      ['Privacy policy', '/privacy'],
      ['Terms & conditions', '/terms'],
      ['Admin', '/admin'],
    ],
  },
]

export function SiteFooter() {
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const addToast = useUiStore((state) => state.addToast)
  const settings = useSettingsStore((state) => state.settings)

  async function subscribe(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    try {
      await api.newsletter(email)
      setEmail('')
      addToast('You’re on the SCARLET list.')
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'Could not subscribe.', 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <footer className="burgundy-band mt-16 pb-20 text-ivory md:pb-0">
      <div className="mx-auto max-w-7xl px-5 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="grid gap-12 border-b border-ivory/15 pb-12 lg:grid-cols-[1.15fr_1fr]">
          <div>
            <p className="eyebrow !text-rose">Letters from the atelier</p>
            <h2 className="mt-3 max-w-lg font-display text-4xl leading-tight">A little sparkle, delivered occasionally.</h2>
            <p className="mt-4 max-w-lg text-sm leading-relaxed text-ivory/65">New charms, styling ideas and thoughtful notes. This demo signup is stored locally by the demo backend; connect your approved email platform before launch.</p>
          </div>
          <form onSubmit={subscribe} className="self-end" aria-label="Newsletter signup">
            <label htmlFor="footer-email" className="sr-only">Email address</label>
            <div className="flex border-b border-ivory/45 py-2 focus-within:border-gold-light">
              <Mail size={18} className="mr-3 mt-2 text-gold-light" />
              <input id="footer-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Your email address" className="min-w-0 flex-1 bg-transparent py-2 text-sm text-white placeholder:text-ivory/45 outline-none" />
              <button disabled={busy} className="grid h-9 w-9 place-items-center rounded-full border border-ivory/30 transition-colors hover:bg-ivory hover:text-burgundy" aria-label="Subscribe">
                <ArrowRight size={17} />
              </button>
            </div>
          </form>
        </div>

        <div className="grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-[1.5fr_repeat(3,1fr)]">
          <div className="sm:col-span-2 lg:col-span-1">
            <Logo light />
            <p className="mt-5 max-w-xs text-sm leading-relaxed text-ivory/60">A configurable demo charm atelier built around a tactile, touch-friendly necklace designer.</p>
            <p className="mt-4 inline-flex rounded-full border border-rose/35 px-3 py-1 text-[9px] uppercase tracking-[0.18em] text-rose">Demo business details</p>
            <div className="mt-4 space-y-1 text-xs text-ivory/55">
              <p>{settings.store_email}</p>
              <p>{settings.store_phone}</p>
              <p>{settings.store_address}</p>
            </div>
            <a href="https://instagram.com/" target="_blank" rel="noreferrer" className="mt-5 inline-flex h-9 w-9 items-center justify-center rounded-full border border-ivory/25 hover:border-gold-light hover:text-gold-light" aria-label="Instagram placeholder link"><Instagram size={16} /></a>
          </div>
          {groups.map((group) => (
            <div key={group.title}>
              <h3 className="text-[10px] font-medium uppercase tracking-[0.22em] text-gold-light">{group.title}</h3>
              <ul className="mt-5 space-y-3">
                {group.links.map(([label, href]) => (
                  <li key={href}><Link to={href} className="text-sm text-ivory/60 transition-colors hover:text-ivory">{label}</Link></li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-2 border-t border-ivory/15 pt-6 text-[10px] uppercase tracking-[0.14em] text-ivory/40 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} SCARLET — demonstration storefront.</p>
          <p>PKR · Pakistan · Payment gateway not configured</p>
        </div>
      </div>
    </footer>
  )
}
