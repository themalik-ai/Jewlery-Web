import { Search, SlidersHorizontal, X } from 'lucide-react'
import type { Category } from '../../lib/types'

export interface FilterValue {
  search: string
  category: string
  sort: string
}

export function ProductFilters({ value, onChange, categories, compact = false }: { value: FilterValue; onChange: (next: FilterValue) => void; categories: Category[]; compact?: boolean }) {
  const active = Boolean(value.search || value.category)
  return (
    <div className={`${compact ? 'space-y-3' : 'space-y-4'}`}>
      <div className="flex flex-col gap-2.5 sm:flex-row">
        <label className="relative min-w-0 flex-1">
          <span className="sr-only">Search charms</span>
          <Search size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="search"
            value={value.search}
            onChange={(event) => onChange({ ...value, search: event.target.value })}
            placeholder="Search by charm name…"
            className="input !rounded-full !py-2.5 !pl-10 !text-xs"
            data-product-search
          />
        </label>
        <label className="relative sm:w-52">
          <span className="sr-only">Sort charms</span>
          <SlidersHorizontal size={15} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
          <select value={value.sort} onChange={(event) => onChange({ ...value, sort: event.target.value })} className="input appearance-none !rounded-full !py-2.5 !pl-10 !text-xs">
            <option value="featured">Featured first</option>
            <option value="newest">Newest</option>
            <option value="price-asc">Price: low to high</option>
            <option value="price-desc">Price: high to low</option>
            <option value="name-asc">Name: A–Z</option>
          </select>
        </label>
      </div>
      <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1" aria-label="Charm categories">
        <button onClick={() => onChange({ ...value, category: '' })} className={`chip shrink-0 ${!value.category ? 'chip-active' : ''}`}>All charms</button>
        {categories.map((category) => (
          <button key={category.slug} onClick={() => onChange({ ...value, category: category.slug === value.category ? '' : category.slug })} className={`chip shrink-0 ${value.category === category.slug ? 'chip-active' : ''}`}>
            {category.name}
          </button>
        ))}
        {active && <button onClick={() => onChange({ ...value, search: '', category: '' })} className="chip shrink-0 !border-transparent !bg-blush !text-burgundy"><X size={12} /> Clear</button>}
      </div>
    </div>
  )
}
