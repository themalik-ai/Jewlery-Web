import { AlertCircle, SearchX } from 'lucide-react'
import type { Product } from '../../lib/types'
import { ProductCard } from './ProductCard'

export function ProductGrid({ products, loading = false, error, mode = 'shop', quantities = new Map(), columns = 'default' }: {
  products: Product[]
  loading?: boolean
  error?: string | null
  mode?: 'shop' | 'builder'
  quantities?: Map<number, number>
  columns?: 'default' | 'dense'
}) {
  const grid = columns === 'dense'
    ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6'
    : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4'

  if (loading) {
    return (
      <div className={`grid ${grid} gap-3 sm:gap-4`} aria-label="Loading charms" aria-busy="true">
        {Array.from({ length: columns === 'dense' ? 12 : 8 }, (_, index) => (
          <div key={index} className="overflow-hidden rounded-xl border border-line bg-white">
            <div className="skeleton aspect-square" />
            <div className="p-3"><div className="skeleton h-2.5 w-4/5 rounded" /><div className="skeleton mt-2 h-3 w-2/5 rounded" /><div className="skeleton mt-4 h-7 rounded-full" /></div>
          </div>
        ))}
      </div>
    )
  }
  if (error) {
    return (
      <div className="rounded-2xl border border-rose/40 bg-blush/35 px-5 py-10 text-center" role="alert">
        <AlertCircle className="mx-auto text-burgundy" size={25} />
        <h3 className="mt-3 font-display text-2xl">The charm case is temporarily closed</h3>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted">{error}</p>
      </div>
    )
  }
  if (products.length === 0) {
    return (
      <div className="rounded-2xl border border-line bg-white px-5 py-12 text-center">
        <SearchX className="mx-auto text-burgundy" size={25} />
        <h3 className="mt-3 font-display text-2xl">No charms found</h3>
        <p className="mt-2 text-sm text-muted">Try another search or clear a filter.</p>
      </div>
    )
  }
  return (
    <div className={`grid ${grid} gap-3 sm:gap-4`}>
      {products.map((product) => (
        <ProductCard key={product.id} product={product} mode={mode} quantity={quantities.get(product.id) || 0} compact={columns === 'dense'} />
      ))}
    </div>
  )
}
