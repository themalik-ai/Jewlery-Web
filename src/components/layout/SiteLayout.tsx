import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { useSettingsStore } from '../../store/settingsStore'
import { CartDrawer } from './CartDrawer'
import { MobileBottomNavigation } from './MobileBottomNavigation'
import { SiteFooter } from './SiteFooter'
import { SiteHeader } from './SiteHeader'
import { ToastViewport } from './ToastViewport'
import { WhatsAppFloatingButton } from './WhatsAppFloatingButton'

export function SiteLayout() {
  const loadSettings = useSettingsStore((state) => state.load)
  const location = useLocation()

  useEffect(() => { void loadSettings() }, [loadSettings])
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' }) }, [location.pathname])

  return (
    <div className="min-h-screen overflow-x-hidden">
      <a href="#main-content" className="sr-only z-[200] bg-burgundy p-3 text-white focus:not-sr-only focus:fixed focus:left-3 focus:top-3">Skip to content</a>
      <SiteHeader />
      <main id="main-content" className="min-h-[55vh] pb-4 md:pb-0">
        <Outlet />
      </main>
      <SiteFooter />
      <MobileBottomNavigation />
      <WhatsAppFloatingButton />
      <CartDrawer />
      <ToastViewport />
    </div>
  )
}
