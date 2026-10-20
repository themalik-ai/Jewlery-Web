import { Minus, Plus, Sparkles, Trash2 } from 'lucide-react'
import type { Product } from '../../lib/types'
import { formatPKR } from '../../config/store'
import { useEditorStore } from '../../store/editorStore'

export function SelectedCharms({ products, basePrice }: { products: Product[]; basePrice: number }) {
  const instances = useEditorStore((state) => state.instances)
  const setQuantity = useEditorStore((state) => state.setProductQuantity)
  const removeProduct = useEditorStore((state) => state.removeProduct)
  const productMap = new Map(products.map((product) => [product.id, product]))
  const quantities = new Map<number, number>()
  instances.forEach((instance) => quantities.set(instance.productId, (quantities.get(instance.productId) || 0) + 1))
  const rows = [...quantities.entries()].flatMap(([id, qty]) => {
    const product = productMap.get(id)
    return product ? [{ product, qty }] : []
  })
  const charmsTotal = rows.reduce((sum, row) => sum + row.product.price_pkr * row.qty, 0)
  const total = basePrice + charmsTotal

  return (
    <section className="rounded-2xl border border-line bg-white" aria-labelledby="selected-charms-title">
      <div className="flex flex-col gap-3 border-b border-line px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div>
          <p className="eyebrow">Current design</p>
          <h2 id="selected-charms-title" className="mt-1 font-display text-2xl">Your selected charms</h2>
        </div>
        <div className="flex items-center gap-3 sm:text-right">
          <div>
            <p className="text-[9px] uppercase tracking-[0.14em] text-muted">{rows.length} unique · {instances.length} total</p>
            <p className="mt-0.5 font-display text-2xl font-semibold text-burgundy">{formatPKR(total)}</p>
          </div>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="flex items-center gap-3 px-4 py-5 text-sm text-muted sm:px-5">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-blush text-burgundy"><Sparkles size={17} /></span>
          <p>Pick a charm below or drag it directly onto the necklace. Your chain ({formatPKR(basePrice)}) is included in the total.</p>
        </div>
      ) : (
        <div className="no-scrollbar flex gap-3 overflow-x-auto p-4 sm:p-5">
          {rows.map(({ product, qty }) => (
            <div key={product.id} className="flex min-w-[248px] items-center gap-3 rounded-xl border border-line bg-cream/45 p-2.5">
              <img src={product.image_url} alt="" className="h-14 w-14 shrink-0 rounded-lg border border-line object-cover" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[9px] font-medium uppercase tracking-[0.08em]">{product.name}</p>
                <p className="mt-1 text-xs font-medium text-burgundy">{formatPKR(product.price_pkr * qty)}</p>
                <div className="mt-1.5 flex items-center justify-between gap-2">
                  <div className="qty-pill">
                    <button onClick={() => setQuantity(product.id, qty - 1)} aria-label={`Decrease ${product.name} quantity`}><Minus size={10} /></button>
                    <span>{qty}</span>
                    <button onClick={() => setQuantity(product.id, qty + 1)} disabled={qty >= Math.min(product.stock_quantity, 12)} aria-label={`Increase ${product.name} quantity`}><Plus size={10} /></button>
                  </div>
                  <button onClick={() => removeProduct(product.id)} className="grid h-7 w-7 place-items-center rounded-full text-muted hover:bg-blush hover:text-burgundy" aria-label={`Remove all ${product.name}`}><Trash2 size={13} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-1 border-t border-line bg-cream/40 px-4 py-2.5 text-[9px] uppercase tracking-[0.12em] text-muted sm:px-5">
        <span>Chain {formatPKR(basePrice)}</span><span>Charms {formatPKR(charmsTotal)}</span><span className="text-burgundy">Design total {formatPKR(total)}</span>
      </div>
    </section>
  )
}
