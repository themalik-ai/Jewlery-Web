import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowDown, Sparkles } from 'lucide-react'
import type { Category, Product } from '../../lib/types'
import { formatPKR } from '../../config/store'
import { useEditorStore } from '../../store/editorStore'
import { useCartStore } from '../../store/cartStore'
import { useUiStore } from '../../store/uiStore'
import { useSettingsStore } from '../../store/settingsStore'
import { ProductFilters, type FilterValue } from '../products/ProductFilters'
import { ProductGrid } from '../products/ProductGrid'
import { ConfirmDialog } from '../ui/ConfirmDialog'
import { BuilderToolbar } from './BuilderToolbar'
import { NecklaceCanvas } from './NecklaceCanvas'
import { SelectedCharms } from './SelectedCharms'

export function NecklaceBuilder({ products, categories }: { products: Product[]; categories: Category[] }) {
  const [filters, setFilters] = useState<FilterValue>({ search: '', category: '', sort: 'featured' })
  const [confirmClear, setConfirmClear] = useState(false)
  const navigate = useNavigate()
  const instances = useEditorStore((state) => state.instances)
  const clear = useEditorStore((state) => state.clear)
  const addNecklace = useCartStore((state) => state.addNecklace)
  const closeDrawer = useCartStore((state) => state.closeDrawer)
  const addToast = useUiStore((state) => state.addToast)
  const basePrice = useSettingsStore((state) => state.settings.chain_base_price_pkr)

  const quantities = useMemo(() => {
    const map = new Map<number, number>()
    instances.forEach((instance) => map.set(instance.productId, (map.get(instance.productId) || 0) + 1))
    return map
  }, [instances])

  const visibleProducts = useMemo(() => {
    let result = products.filter((product) => {
      const search = filters.search.trim().toLowerCase()
      return (!filters.category || product.category === filters.category) && (!search || product.name.toLowerCase().includes(search))
    })
    if (filters.sort === 'price-asc') result = [...result].sort((a, b) => a.price_pkr - b.price_pkr)
    else if (filters.sort === 'price-desc') result = [...result].sort((a, b) => b.price_pkr - a.price_pkr)
    else if (filters.sort === 'name-asc') result = [...result].sort((a, b) => a.name.localeCompare(b.name))
    else if (filters.sort === 'newest') result = [...result].sort((a, b) => Number(b.is_new) - Number(a.is_new) || b.id - a.id)
    else result = [...result].sort((a, b) => Number(b.is_featured) - Number(a.is_featured) || a.id - b.id)
    return result
  }, [products, filters])

  const charmTotal = instances.reduce((sum, instance) => sum + (products.find((product) => product.id === instance.productId)?.price_pkr || 0), 0)

  function checkout() {
    if (instances.length === 0) {
      addToast('Choose at least one charm before checking out your custom necklace.', 'error')
      document.querySelector('[data-product-search]')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }
    const missing = instances.some((instance) => !products.some((product) => product.id === instance.productId && product.stock_quantity > 0))
    if (missing) {
      addToast('One of your charms is no longer available. Please update the design.', 'error')
      return
    }
    addNecklace(instances, products, basePrice)
    closeDrawer()
    addToast('Your custom necklace has been saved to the bag.')
    navigate('/checkout')
  }

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow">Step 1 · Make it yours</p>
          <h2 className="mt-1 font-display text-3xl sm:text-4xl">Your necklace canvas</h2>
        </div>
        <div className="flex items-end justify-between gap-5 sm:text-right">
          <div>
            <p className="text-[9px] uppercase tracking-[0.15em] text-muted">Chain + {instances.length} {instances.length === 1 ? 'charm' : 'charms'}</p>
            <p className="font-display text-2xl font-semibold text-burgundy">{formatPKR(basePrice + charmTotal)}</p>
          </div>
        </div>
      </div>

      <NecklaceCanvas products={products} />

      <div className="px-1 py-4 sm:px-2">
        <p className="mb-3 flex items-center justify-center gap-2 text-center font-display text-xl italic text-burgundy sm:text-2xl">
          <Sparkles size={16} /> Drag and place your charms <ArrowDown size={15} />
        </p>
        <BuilderToolbar onClear={() => setConfirmClear(true)} onCheckout={checkout} />
      </div>

      <div className="mt-3">
        <SelectedCharms products={products} basePrice={basePrice} />
      </div>

      <section className="mt-8" aria-labelledby="charm-catalogue-title">
        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="eyebrow">Step 2 · Curate your story</p>
            <h2 id="charm-catalogue-title" className="mt-1 font-display text-3xl sm:text-4xl">The charm case</h2>
          </div>
          <p className="max-w-sm text-xs leading-relaxed text-muted sm:text-right">Tap to add, or drag any charm onto the chain. Use quantity controls for duplicates.</p>
        </div>
        <ProductFilters value={filters} onChange={setFilters} categories={categories} compact />
        <div className="mt-5">
          <ProductGrid products={visibleProducts} mode="builder" quantities={quantities} columns="dense" />
        </div>
      </section>

      <ConfirmDialog
        open={confirmClear}
        title="Start over?"
        description={`This will remove ${instances.length === 1 ? 'the selected charm' : `all ${instances.length} charms`} from the necklace. Your other shopping bag items will not be affected, and you can still use Undo immediately afterwards.`}
        confirmLabel="Clear design"
        danger
        onCancel={() => setConfirmClear(false)}
        onConfirm={() => { clear(); setConfirmClear(false); addToast('The necklace canvas is clear.', 'info') }}
      />
    </div>
  )
}
