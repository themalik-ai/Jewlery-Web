import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import { useLockBodyScroll } from '../../lib/hooks'

interface ConfirmDialogProps {
  open: boolean
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({ open, title, description, confirmLabel = 'Confirm', cancelLabel = 'Cancel', danger = false, onConfirm, onCancel }: ConfirmDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null)
  useLockBodyScroll(open)
  useEffect(() => {
    if (!open) return
    cancelRef.current?.focus()
    const key = (event: KeyboardEvent) => { if (event.key === 'Escape') onCancel() }
    window.addEventListener('keydown', key)
    return () => window.removeEventListener('keydown', key)
  }, [open, onCancel])
  if (!open) return null
  return (
    <div className="fixed inset-0 z-[110] grid place-items-center bg-ink/35 p-4 backdrop-blur-[2px]" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) onCancel() }}>
      <div role="alertdialog" aria-modal="true" aria-labelledby="confirm-title" aria-describedby="confirm-description" className="w-full max-w-md rounded-2xl border border-line bg-ivory p-6 shadow-soft">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="eyebrow">Please confirm</p>
            <h2 id="confirm-title" className="mt-2 font-display text-3xl text-ink">{title}</h2>
          </div>
          <button onClick={onCancel} aria-label="Close confirmation" className="grid h-8 w-8 place-items-center rounded-full text-muted hover:bg-blush hover:text-ink"><X size={17} /></button>
        </div>
        <p id="confirm-description" className="mt-3 text-sm leading-relaxed text-muted">{description}</p>
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button ref={cancelRef} onClick={onCancel} className="btn-ghost !px-5 !py-2.5">{cancelLabel}</button>
          <button onClick={onConfirm} className={`${danger ? 'btn-primary' : 'btn-pink'} !px-5 !py-2.5`}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  )
}
