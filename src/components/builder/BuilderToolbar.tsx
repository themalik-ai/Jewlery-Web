import { Minus, Plus, Redo2, RotateCcw, ShoppingBag, Trash2, Undo2 } from 'lucide-react'
import { useEditorStore } from '../../store/editorStore'

export function BuilderToolbar({ onClear, onCheckout }: { onClear: () => void; onCheckout: () => void }) {
  const historyLength = useEditorStore((state) => state.history.length)
  const futureLength = useEditorStore((state) => state.future.length)
  const count = useEditorStore((state) => state.instances.length)
  const zoom = useEditorStore((state) => state.zoom)
  const undo = useEditorStore((state) => state.undo)
  const redo = useEditorStore((state) => state.redo)
  const setZoom = useEditorStore((state) => state.setZoom)
  const resetZoom = useEditorStore((state) => state.resetZoom)

  const toolClass = 'inline-flex h-9 items-center justify-center gap-1.5 rounded-full border border-line bg-white px-3 text-[9px] font-medium uppercase tracking-[0.12em] text-ink transition-colors hover:border-rose hover:bg-petal disabled:cursor-not-allowed disabled:opacity-35 sm:h-10 sm:px-4 sm:text-[10px]'

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="no-scrollbar flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0" aria-label="Design editing tools">
        <button className={toolClass} onClick={undo} disabled={!historyLength} aria-label="Undo last design change"><Undo2 size={14} /> Undo</button>
        <button className={toolClass} onClick={redo} disabled={!futureLength} aria-label="Redo design change"><Redo2 size={14} /> Redo</button>
        <button className={toolClass} onClick={onClear} disabled={!count} aria-label="Clear necklace design"><Trash2 size={14} /> Clear</button>
        <div className="flex shrink-0 items-center rounded-full border border-line bg-white" aria-label={`Zoom ${Math.round(zoom * 100)} percent`}>
          <button className="grid h-9 w-9 place-items-center rounded-full hover:bg-petal disabled:opacity-30 sm:h-10 sm:w-10" onClick={() => setZoom(zoom - 0.15)} disabled={zoom <= 0.75} aria-label="Zoom out"><Minus size={14} /></button>
          <button onClick={resetZoom} className="min-w-[48px] text-[9px] font-medium tabular-nums text-muted hover:text-burgundy" aria-label="Reset zoom to fit">{Math.round(zoom * 100)}%</button>
          <button className="grid h-9 w-9 place-items-center rounded-full hover:bg-petal disabled:opacity-30 sm:h-10 sm:w-10" onClick={() => setZoom(zoom + 0.15)} disabled={zoom >= 1.75} aria-label="Zoom in"><Plus size={14} /></button>
        </div>
        <button className={toolClass} onClick={resetZoom} disabled={zoom === 1} aria-label="Reset necklace view"><RotateCcw size={13} /> Fit</button>
      </div>
      <button className="btn-pink min-h-11 shrink-0 !px-6 !py-2.5" onClick={onCheckout} aria-label={`Checkout custom necklace with ${count} ${count === 1 ? 'charm' : 'charms'}`}>
        <ShoppingBag size={16} /> Checkout design
      </button>
    </div>
  )
}
