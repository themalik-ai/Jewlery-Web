import { NavLink } from 'react-router-dom'
import { Gem, Home, Search, ShoppingBag } from 'lucide-react'
import { cartBadgeCount, useCartStore } from '../../store/cartStore'

const links = [
  { to: '/', label: 'Home', icon: Home },
  { to: '/shop', label: 'Shop', icon: Search },
  { to: '/builder', label: 'Design', icon: Gem },
  { to: '/cart', label: 'Bag', icon: ShoppingBag },
]

export function MobileBottomNavigation() {
  const count = useCartStore((state) => cartBadgeCount(state.lines))
  return (
    <nav className="mobile-bottom-nav fixed inset-x-0 bottom-0 z-40 border-t border-burgundy-dark/40 bg-burgundy text-ivory shadow-[0_-8px_30px_-16px_rgba(53,10,20,.5)] md:hidden" aria-label="Quick navigation">
      <div className="mx-auto grid max-w-md grid-cols-4">
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) => `relative flex min-h-[56px] flex-col items-center justify-center gap-1 text-[8px] uppercase tracking-[0.14em] transition-colors ${isActive ? 'text-gold-light' : 'text-ivory/65'}`}
          >
            {({ isActive }) => (
              <>
                {isActive && <span className="absolute top-0 h-[2px] w-8 rounded-b-full bg-gold-light" />}
                <span className="relative">
                  <Icon size={19} strokeWidth={isActive ? 2 : 1.6} />
                  {label === 'Bag' && count > 0 && <span className="absolute -right-2 -top-1 grid h-3.5 min-w-3.5 place-items-center rounded-full bg-rose px-0.5 text-[7px] font-bold text-burgundy">{count}</span>}
                </span>
                <span>{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
