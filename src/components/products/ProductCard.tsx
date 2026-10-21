import { PointerEvent as ReactPointerEvent, useEffect, useRef } from 'react'
import { Check, GripVertical, Minus, Plus, ShoppingBag } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { Product } from '../../lib/types'
import { formatPKR } from '../../config/store'
import { useEditorStore } from '../../store/editorStore'
import { useCartStore } from '../../store/cartStore'
import { useUiStore } from '../../store/uiStore'

interface ProductCardProps {
  product: Product
  mode?: 'shop' | 'builder'
  quantity?: number
  compact?: boolean
}

export function ProductCard({ product, mode = 'shop', quantity = 0, compact = false }: ProductCardProps) {
  const drag = useRef<{ id: number; x: number; y: number; moved: boolean } | null>(null)
  const ghostElement = useRef<HTMLDivElement | null>(null)
  const addCharm = useEditorStore((state) => state.addCharm)
  const setProductQuantity = useEditorStore((state) => state.setProductQuantity)
  const addProduct = useCartStore((state) => state.addProduct)
  const addToast = useUiStore((state) => state.addToast)
  const selected = mode === 'builder' && quantity > 0

  useEffect(() => () => {
    ghostElement.current?.remove()
    ghostElement.current = null
    document.body.style.userSelect = ''
  }, [])

  function showGhost(x: number, y: number) {
    if (!ghostElement.current) {
      const element = document.createElement('div')
      element.className = 'drag-ghost'
      element.setAttribute('aria-hidden', 'true')
      const image = document.createElement('img')
      image.src = product.image_url
      image.alt = ''
      image.className = 'h-full w-full object-cover'
      element.appendChild(image)
      document.body.appendChild(element)
      ghostElement.current = element
    }
    ghostElement.current.style.left = `${x}px`
    ghostElement.current.style.top = `${y}px`
  }

  function hideGhost() {
    ghostElement.current?.remove()
    ghostElement.current = null
  }

  function chooseCharm() {
    addCharm(product.id)
    addToast(`${product.name} added to your necklace.`)
  }

  function handleImagePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (mode !== 'builder' || event.button !== 0) return
    // Prevent the browser's native image drag, which otherwise cancels the
    // Pointer Event gesture before our touch-compatible drop handler runs.
    event.preventDefault()
    // Window-level listeners keep tracking the pointer outside the card. Avoiding
    // pointer capture here is intentional: rendering the floating drag preview
    // can make some mobile engines cancel a captured pointer mid-gesture.
    drag.current = { id: event.pointerId, x: event.clientX, y: event.clientY, moved: false }

    const move = (moveEvent: PointerEvent) => {
      if (!drag.current || moveEvent.pointerId !== drag.current.id) return
      const distance = Math.hypot(moveEvent.clientX - drag.current.x, moveEvent.clientY - drag.current.y)
      if (distance > 7) {
        drag.current.moved = true
        showGhost(moveEvent.clientX, moveEvent.clientY)
        document.body.style.userSelect = 'none'
        // Keep long catalogue-to-canvas drags practical on short and mobile
        // viewports. Repeated pointer movement near an edge gently scrolls.
        if (moveEvent.clientY < 84) window.scrollBy({ top: -20, behavior: 'instant' })
        else if (moveEvent.clientY > window.innerHeight - 84) window.scrollBy({ top: 20, behavior: 'instant' })
      }
    }
    const finish = (upEvent: PointerEvent) => {
      if (!drag.current || upEvent.pointerId !== drag.current.id) return
      const wasMoved = drag.current.moved
      drag.current = null
      hideGhost()
      document.body.style.userSelect = ''
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', finish)
      window.removeEventListener('pointercancel', cancel)
      if (wasMoved) {
        const dropTarget = document.elementFromPoint(upEvent.clientX, upEvent.clientY)?.closest('[data-necklace-canvas]')
        if (dropTarget) {
          window.dispatchEvent(new CustomEvent('scarlet:drop-charm', {
            detail: { productId: product.id, clientX: upEvent.clientX, clientY: upEvent.clientY },
          }))
        }
      } else {
        chooseCharm()
      }
    }
    const cancel = (cancelEvent: PointerEvent) => {
      if (!drag.current || cancelEvent.pointerId !== drag.current.id) return
      drag.current = null
      hideGhost()
      document.body.style.userSelect = ''
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', finish)
      window.removeEventListener('pointercancel', cancel)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', finish)
    window.addEventListener('pointercancel', cancel)
  }

  function addToBag() {
    addProduct(product)
    addToast(`${product.name} added to your bag.`)
  }

  return (
    <article className={`charm-card group ${selected ? 'selected' : ''}`} aria-label={`${product.name}, ${formatPKR(product.price_pkr)}${selected ? `, ${quantity} selected` : ''}`}>
      {selected && (
        <span className="absolute right-2 top-2 z-10 grid h-5 w-5 place-items-center rounded-full bg-burgundy text-white shadow-sm" aria-hidden="true">
          <Check size={12} strokeWidth={3} />
        </span>
      )}
      <div
        role={mode === 'builder' ? 'button' : undefined}
        tabIndex={mode === 'builder' ? 0 : undefined}
        aria-label={mode === 'builder' ? `Add ${product.name} to necklace. Drag onto the canvas or press Enter.` : undefined}
        onKeyDown={(event) => {
          if (mode === 'builder' && (event.key === 'Enter' || event.key === ' ')) {
            event.preventDefault()
            chooseCharm()
          }
        }}
        onPointerDown={handleImagePointerDown}
        className={`relative overflow-hidden rounded-t-[11px] bg-cream ${compact ? 'aspect-[1.08]' : 'aspect-square'} ${mode === 'builder' ? 'cursor-grab touch-none active:cursor-grabbing' : ''}`}
      >
        <img src={product.image_url} alt={product.alt_text} loading="lazy" draggable={false} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.025]" onError={(event) => { (event.currentTarget as HTMLImageElement).src = '/logo-mark.svg' }} />
        <div className="absolute left-2 top-2 flex gap-1">
          {product.is_new && <span className="rounded-full bg-white/90 px-2 py-1 text-[8px] font-medium uppercase tracking-[0.15em] text-burgundy backdrop-blur">New</span>}
        </div>
        {mode === 'builder' && (
          <span className="absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-full bg-white/90 px-2 py-1 text-[8px] uppercase tracking-[0.12em] text-muted opacity-0 shadow-sm transition-opacity group-hover:opacity-100 sm:opacity-100">
            <GripVertical size={10} /> Drag
          </span>
        )}
      </div>

      <div className={`${compact ? 'p-2.5' : 'p-3 sm:p-3.5'} flex min-h-0 flex-1 flex-col`}>
        <Link to={`/product/${product.slug}`} className={`line-clamp-2 font-medium uppercase leading-[1.35] tracking-[0.08em] text-ink hover:text-burgundy ${compact ? 'text-[9px]' : 'text-[10px] sm:text-[10.5px]'}`}>
          {product.name}
        </Link>
        <p className={`${compact ? 'mt-1 text-[11px]' : 'mt-1.5 text-sm'} font-medium tabular-nums text-burgundy`}>{formatPKR(product.price_pkr)}</p>
        {product.stock_quantity <= 5 && product.stock_quantity > 0 && <p className="mt-1 text-[9px] text-muted">Only {product.stock_quantity} in demo stock</p>}

        {mode === 'builder' ? (
          <div className="mt-auto pt-2.5">
            {quantity > 0 ? (
              <div className="flex items-center justify-between gap-1">
                <span className="text-[8px] uppercase tracking-[0.13em] text-muted">On chain</span>
                <div className="qty-pill">
                  <button onClick={() => setProductQuantity(product.id, quantity - 1)} aria-label={`Remove one ${product.name}`}><Minus size={11} /></button>
                  <span>{quantity}</span>
                  <button onClick={() => setProductQuantity(product.id, quantity + 1)} disabled={quantity >= Math.min(product.stock_quantity, 12)} aria-label={`Add another ${product.name}`}><Plus size={11} /></button>
                </div>
              </div>
            ) : (
              <button onClick={chooseCharm} className="w-full rounded-full border border-rose/60 py-2 text-[8px] font-medium uppercase tracking-[0.15em] text-burgundy transition-colors hover:bg-blush">Add to design</button>
            )}
          </div>
        ) : (
          <button onClick={addToBag} disabled={product.stock_quantity < 1} className="mt-auto flex w-full items-center justify-center gap-1.5 pt-3 text-[9px] font-medium uppercase tracking-[0.14em] text-burgundy transition-colors hover:text-burgundy-dark disabled:text-muted">
            <ShoppingBag size={13} /> {product.stock_quantity > 0 ? 'Add to bag' : 'Unavailable'}
          </button>
        )}
      </div>

    </article>
  )
}
