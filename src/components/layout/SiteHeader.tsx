import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { Menu, Search, ShoppingBag, X } from 'lucide-react'
import { NAV_LINKS } from '../../config/store'
import { useCartStore, cartBadgeCount } from '../../store/cartStore'
import { useSettingsStore } from '../../store/settingsStore'
import { Logo } from './Logo'

export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()
  const lines = useCartStore((state) => state.lines)
  const openDrawer = useCartStore((state) => state.openDrawer)
  const announcement = useSettingsStore((state) => state.settings.announcement)
  const count = cartBadgeCount(lines)

  useEffect(() => setMenuOpen(false), [location.pathname])

  return (
    <>
      <div className="relative z-50 bg-burgundy px-4 py-2 text-center text-[9px] font-medium uppercase tracking-[0.2em] text-ivory sm:text-[10px]">
        {announcement}
      </div>
      <header className="site-header">
        <div className="mx-auto flex h-[70px] max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <button
            className="grid h-10 w-10 place-items-center rounded-full text-ink md:hidden"
            onClick={() => setMenuOpen((value) => !value)}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          >
            {menuOpen ? <X size={21} /> : <Menu size={21} />}
          </button>

          <Logo />

          <nav aria-label="Primary" className="hidden items-center gap-6 md:flex lg:gap-8">
            {NAV_LINKS.map((item) => (
              <NavLink key={item.to} to={item.to} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-0.5 sm:gap-1.5">
            <Link
              to="/shop?focus=search"
              className="hidden h-10 w-10 place-items-center rounded-full text-ink/75 transition-colors hover:bg-blush hover:text-burgundy sm:grid"
              aria-label="Search charms"
            >
              <Search size={18} strokeWidth={1.7} />
            </Link>
            <button
              className="relative grid h-10 w-10 place-items-center rounded-full text-ink/75 transition-colors hover:bg-blush hover:text-burgundy"
              onClick={openDrawer}
              aria-label={`Open shopping bag, ${count} ${count === 1 ? 'item' : 'items'}`}
            >
              <ShoppingBag size={19} strokeWidth={1.7} />
              {count > 0 && (
                <span className="absolute right-0.5 top-0.5 grid h-[17px] min-w-[17px] place-items-center rounded-full bg-burgundy px-1 text-[9px] font-semibold text-white">
                  {count > 99 ? '99+' : count}
                </span>
              )}
            </button>
          </div>
        </div>

        {menuOpen && (
          <nav id="mobile-menu" aria-label="Mobile menu" className="border-t border-line bg-ivory px-5 pb-6 pt-3 md:hidden">
            <div className="flex flex-col">
              {NAV_LINKS.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) => `border-b border-line/70 py-3.5 text-[11px] uppercase tracking-[0.2em] ${isActive ? 'text-burgundy' : 'text-ink/75'}`}
                >
                  {item.label}
                </NavLink>
              ))}
              <div className="mt-4 flex gap-2">
                <Link to="/track-order" className="chip flex-1 justify-center">Track order</Link>
                <Link to="/faq" className="chip flex-1 justify-center">FAQ</Link>
              </div>
            </div>
          </nav>
        )}
      </header>
    </>
  )
}
