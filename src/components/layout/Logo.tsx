import { Link } from 'react-router-dom'
import { STORE_CONFIG } from '../../config/store'

export function Logo({ light = false, compact = false }: { light?: boolean; compact?: boolean }) {
  return (
    <Link
      to="/"
      className={`group inline-flex items-center gap-2.5 ${light ? 'text-ivory' : 'text-burgundy'}`}
      aria-label={`${STORE_CONFIG.brandName} home`}
    >
      <span className={`relative grid ${compact ? 'h-8 w-8' : 'h-9 w-9'} place-items-center rounded-full border ${light ? 'border-ivory/35' : 'border-gold/45'} transition-transform group-hover:rotate-6`}>
        <span className="font-display text-xl italic leading-none">S</span>
        <span className={`absolute -right-0.5 top-0 h-1.5 w-1.5 rotate-45 ${light ? 'bg-gold-light' : 'bg-gold'}`} />
      </span>
      <span className="flex flex-col leading-none">
        <span className={`${compact ? 'text-[16px]' : 'text-[19px]'} font-medium tracking-[0.31em]`}>SCARLET</span>
        {!compact && <span className={`mt-1 text-[7px] uppercase tracking-[0.3em] ${light ? 'text-ivory/60' : 'text-muted'}`}>Charm Atelier</span>}
      </span>
    </Link>
  )
}
