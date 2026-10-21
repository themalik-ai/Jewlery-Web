import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Minus, Plus, ShoppingBag, Trash2, X } from 'lucide-react'
import { formatPKR } from '../../config/store'
import { useLockBodyScroll } from '../../lib/hooks'
import { cartSubtotal, lineTotal, useCartStore } from '../../store/cartStore'
import { MiniNecklaceFromCart } from '../builder/MiniNecklace'

export function CartDrawer() {
  const open = useCartStore((state) => state.isDrawerOpen)
  const lines = useCartStore((state) => state.lines)
  const close = useCartStore((state) => state.closeDrawer)
  const remove = useCartStore((state) => state.removeLine)
  const setQuantity = useCartStore((state) => state.setProductQuantity)
  useLockBodyScroll(open)

  useEffect(() => {
    if (!open) return
    const key = (event: KeyboardEvent) => { if (event.key === 'Escape') close() }
    window.addEventListener('keydown', key)
    return () => window.removeEventListener('keydown', key)
  }, [open, close])

  if (!open) return null
  const subtotal = cartSubtotal(lines)

  return (
    <div className="fixed inset-0 z-[90]" role="presentation">
      <button className="absolute inset-0 bg-ink/30 backdrop-blur-[1px]" onClick={close} aria-label="Close shopping bag" />
      <aside role="dialog" aria-modal="true" aria-labelledby="bag-title" className="absolute inset-y-0 right-0 flex w-full max-w-md animate-floatIn flex-col bg-ivory shadow-2xl">
        <div className="flex items-center justify-between border-b border-line px-5 py-5">
          <div>
            <p className="eyebrow">Your selection</p>
            <h2 id="bag-title" className="mt-1 font-display text-3xl">Shopping bag</h2>
          </div>
          <button onClick={close} className="grid h-10 w-10 place-items-center rounded-full border border-line text-muted hover:bg-blush hover:text-ink" aria-label="Close bag"><X size={19} /></button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {lines.length === 0 ? (
            <div className="flex h-full min-h-[350px] flex-col items-center justify-center text-center">
              <span className="grid h-14 w-14 place-items-center rounded-full bg-blush text-burgundy"><ShoppingBag size={22} /></span>
              <h3 className="mt-4 font-display text-2xl">Your bag is waiting</h3>
              <p className="mt-2 max-w-xs text-sm leading-relaxed text-muted">Choose a charm, or create a necklace that tells your story.</p>
              <Link to="/builder" onClick={close} className="btn-primary mt-5">Start designing</Link>
            </div>
          ) : (
            <ul className="divide-y divide-line">
              {lines.map((line) => (
                <li key={line.id} className="py-4">
                  <div className="flex gap-3">
                    <div className="mini-necklace-wrap h-24 w-24 shrink-0 overflow-hidden rounded-xl border border-line">
                      {line.type === 'product'
                        ? <img src={line.image} alt="" className="h-full w-full object-cover" />
                        : <MiniNecklaceFromCart line={line} className="h-full w-full" />}
                    </div>
                    <div className="min-w-0 flex-1 pt-1">
                      <div className="flex items-start gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="text-[10px] uppercase tracking-[0.16em] text-muted">{line.type === 'necklace' ? 'Your design' : 'Charm'}</p>
                          <p className="mt-1 truncate text-sm font-medium text-ink">{line.name}</p>
                        </div>
                        <button onClick={() => remove(line.id)} className="text-muted hover:text-burgundy" aria-label={`Remove ${line.name}`}><Trash2 size={16} /></button>
                      </div>
                      {line.type === 'necklace' ? (
                        <p className="mt-2 text-xs text-muted">Chain + {line.positions.length} {line.positions.length === 1 ? 'charm' : 'charms'}</p>
                      ) : (
                        <div className="qty-pill mt-2">
                          <button onClick={() => setQuantity(line.id, line.quantity - 1)} aria-label={`Decrease ${line.name} quantity`}><Minus size={12} /></button>
                          <span>{line.quantity}</span>
                          <button onClick={() => setQuantity(line.id, line.quantity + 1)} disabled={line.quantity >= 20} aria-label={`Increase ${line.name} quantity`}><Plus size={12} /></button>
                        </div>
                      )}
                      <p className="mt-2 text-sm font-medium text-burgundy">{formatPKR(lineTotal(line))}</p>
                    </div>
                  </div>
                  {line.type === 'necklace' && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {line.charms.map((charm) => <span key={charm.productId} className="rounded-full bg-blush/70 px-2.5 py-1 text-[9px] uppercase tracking-wide text-burgundy">{charm.qty}× {charm.name}</span>)}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        {lines.length > 0 && (
          <div className="border-t border-line bg-white/70 px-5 py-5 pb-safe">
            <div className="mb-1 flex items-center justify-between">
              <span className="text-sm text-muted">Subtotal</span>
              <span className="font-display text-2xl font-semibold text-ink">{formatPKR(subtotal)}</span>
            </div>
            <p className="mb-4 text-[10px] leading-relaxed text-muted">Shipping and any configured tax are calculated at checkout. Server prices are authoritative.</p>
            <Link to="/checkout" onClick={close} className="btn-primary w-full">Checkout securely</Link>
            <Link to="/cart" onClick={close} className="mt-2 flex justify-center py-2 text-[11px] uppercase tracking-[0.16em] text-burgundy underline-offset-4 hover:underline">View full bag</Link>
          </div>
        )}
      </aside>
    </div>
  )
}
