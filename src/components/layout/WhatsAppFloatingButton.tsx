import { useEffect, useRef, useState } from 'react'
import { MessageCircle, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { STORE_CONFIG, whatsappHref } from '../../config/store'
import { useSettingsStore } from '../../store/settingsStore'

export function WhatsAppFloatingButton() {
  const [open, setOpen] = useState(false)
  const wrapper = useRef<HTMLDivElement>(null)
  const configured = useSettingsStore((state) => state.settings.whatsapp_number) || STORE_CONFIG.whatsappNumber
  const href = whatsappHref(configured, STORE_CONFIG.whatsappPrefill)

  useEffect(() => {
    const listener = (event: PointerEvent) => {
      if (open && wrapper.current && !wrapper.current.contains(event.target as Node)) setOpen(false)
    }
    window.addEventListener('pointerdown', listener)
    return () => window.removeEventListener('pointerdown', listener)
  }, [open])

  return (
    <div ref={wrapper} className="fixed bottom-[74px] right-4 z-30 flex flex-col items-end gap-2 md:bottom-6 md:right-6">
      {open && (
        <div className="w-72 rounded-2xl border border-line bg-white p-4 shadow-soft" role="status">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-medium text-ink">Chat with the atelier</p>
            <button onClick={() => setOpen(false)} aria-label="Close WhatsApp panel" className="text-muted hover:text-ink"><X size={17} /></button>
          </div>
          {href ? (
            <>
              <p className="mb-3 text-xs leading-relaxed text-muted">Questions about a charm or your design? Continue to WhatsApp to speak with the store.</p>
              <a href={href} target="_blank" rel="noreferrer" className="inline-flex w-full items-center justify-center rounded-full bg-[#25D366] px-4 py-2.5 text-xs font-medium text-white hover:bg-[#1fbd59]">Continue to WhatsApp</a>
            </>
          ) : (
            <>
              <p className="mb-3 text-xs leading-relaxed text-muted">WhatsApp has not been configured for this demo store. No telephone number has been invented.</p>
              <Link to="/contact" onClick={() => setOpen(false)} className="inline-flex w-full items-center justify-center rounded-full bg-burgundy px-4 py-2.5 text-xs font-medium text-white">Use the contact form</Link>
            </>
          )}
        </div>
      )}
      <button
        onClick={() => setOpen((value) => !value)}
        aria-label={open ? 'Close WhatsApp help' : 'Open WhatsApp help'}
        aria-expanded={open}
        className="grid h-12 w-12 place-items-center rounded-full bg-[#25D366] text-white shadow-[0_10px_28px_-8px_rgba(37,211,102,.65)] transition-transform hover:scale-105 md:h-14 md:w-14"
      >
        <MessageCircle size={25} fill="currentColor" strokeWidth={1.5} />
      </button>
    </div>
  )
}
