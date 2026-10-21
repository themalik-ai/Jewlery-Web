import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react'
import { useUiStore } from '../../store/uiStore'

export function ToastViewport() {
  const toasts = useUiStore((state) => state.toasts)
  const remove = useUiStore((state) => state.removeToast)
  return (
    <div className="pointer-events-none fixed right-4 top-24 z-[100] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2" aria-live="polite" aria-atomic="false">
      {toasts.map((toast) => {
        const Icon = toast.kind === 'success' ? CheckCircle2 : toast.kind === 'error' ? AlertCircle : Info
        return (
          <div key={toast.id} className="toast pointer-events-auto animate-floatIn" role={toast.kind === 'error' ? 'alert' : 'status'}>
            <Icon size={18} className={toast.kind === 'success' ? 'text-[#4C8460]' : toast.kind === 'error' ? 'text-burgundy' : 'text-[#4B7094]'} />
            <p className="min-w-0 flex-1 leading-snug text-ink">{toast.message}</p>
            <button onClick={() => remove(toast.id)} className="text-muted hover:text-ink" aria-label="Dismiss notification"><X size={15} /></button>
          </div>
        )
      })}
    </div>
  )
}
