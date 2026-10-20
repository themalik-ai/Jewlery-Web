import { PointerEvent as ReactPointerEvent, useEffect, useMemo, useRef, useState } from 'react'
import { Move, X } from 'lucide-react'
import type { CharmInstance, Product } from '../../lib/types'
import { artUrl, nearestTToPoint, pointOnNecklace } from '../../lib/necklace'
import { useEditorStore } from '../../store/editorStore'
import { useUiStore } from '../../store/uiStore'

interface ViewBox { x: number; y: number; width: number; height: number }
const DESKTOP_VIEW: ViewBox = { x: 0, y: 0, width: 1000, height: 580 }
const MOBILE_VIEW: ViewBox = { x: 145, y: 8, width: 710, height: 540 }
const ZOOM_CENTER = { x: 500, y: 285 }

export function NecklaceCanvas({ products }: { products: Product[] }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const dragRef = useRef<{ pointerId: number; instanceId: string; before: CharmInstance[] } | null>(null)
  const [mobile, setMobile] = useState(false)
  const [justDropped, setJustDropped] = useState(false)
  const instances = useEditorStore((state) => state.instances)
  const zoom = useEditorStore((state) => state.zoom)
  const selectedId = useEditorStore((state) => state.selectedInstanceId)
  const addCharm = useEditorStore((state) => state.addCharm)
  const moveTransient = useEditorStore((state) => state.moveTransient)
  const commitMove = useEditorStore((state) => state.commitMove)
  const selectInstance = useEditorStore((state) => state.selectInstance)
  const removeInstance = useEditorStore((state) => state.removeInstance)
  const addToast = useUiStore((state) => state.addToast)
  const productMap = useMemo(() => new Map(products.map((product) => [product.id, product])), [products])
  const view = mobile ? MOBILE_VIEW : DESKTOP_VIEW

  useEffect(() => {
    if (!containerRef.current) return
    const observer = new ResizeObserver((entries) => setMobile(entries[0].contentRect.width < 600))
    observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [])

  function clientToDesign(clientX: number, clientY: number) {
    const svg = svgRef.current
    if (!svg) return null
    const rect = svg.getBoundingClientRect()
    const scale = Math.min(rect.width / view.width, rect.height / view.height)
    const renderedWidth = view.width * scale
    const renderedHeight = view.height * scale
    const offsetX = (rect.width - renderedWidth) / 2
    const offsetY = (rect.height - renderedHeight) / 2
    const visibleX = view.x + (clientX - rect.left - offsetX) / scale
    const visibleY = view.y + (clientY - rect.top - offsetY) / scale
    // Undo the visual zoom so saved t values remain independent of zoom.
    return {
      x: ZOOM_CENTER.x + (visibleX - ZOOM_CENTER.x) / zoom,
      y: ZOOM_CENTER.y + (visibleY - ZOOM_CENTER.y) / zoom,
    }
  }

  useEffect(() => {
    const drop = (event: Event) => {
      const detail = (event as CustomEvent<{ productId: number; clientX: number; clientY: number }>).detail
      const rect = containerRef.current?.getBoundingClientRect()
      if (!rect || detail.clientX < rect.left || detail.clientX > rect.right || detail.clientY < rect.top || detail.clientY > rect.bottom) return
      const point = clientToDesign(detail.clientX, detail.clientY)
      if (!point) return
      addCharm(detail.productId, nearestTToPoint(point))
      const name = productMap.get(detail.productId)?.name || 'Charm'
      addToast(`${name} placed on your necklace.`)
      setJustDropped(true)
      window.setTimeout(() => setJustDropped(false), 450)
    }
    window.addEventListener('scarlet:drop-charm', drop)
    return () => window.removeEventListener('scarlet:drop-charm', drop)
  }, [addCharm, addToast, productMap, mobile, zoom])

  function startDrag(event: ReactPointerEvent<SVGGElement>, instance: CharmInstance) {
    if (event.button !== 0) return
    event.preventDefault()
    event.stopPropagation()
    selectInstance(instance.instanceId)
    dragRef.current = { pointerId: event.pointerId, instanceId: instance.instanceId, before: instances.map((item) => ({ ...item })) }
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  function dragCharm(event: ReactPointerEvent<SVGGElement>) {
    const drag = dragRef.current
    if (!drag || drag.pointerId !== event.pointerId) return
    const point = clientToDesign(event.clientX, event.clientY)
    if (point) moveTransient(drag.instanceId, nearestTToPoint(point))
  }

  function endDrag(event: ReactPointerEvent<SVGGElement>) {
    const drag = dragRef.current
    if (!drag || drag.pointerId !== event.pointerId) return
    dragRef.current = null
    commitMove(drag.before)
  }

  function keyboardMove(event: React.KeyboardEvent<SVGGElement>, instance: CharmInstance, name: string) {
    if (event.key === 'Delete' || event.key === 'Backspace') {
      event.preventDefault()
      removeInstance(instance.instanceId)
      addToast(`${name} removed from your necklace.`, 'info')
      return
    }
    if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return
    event.preventDefault()
    const before = instances.map((item) => ({ ...item }))
    moveTransient(instance.instanceId, instance.t + (event.key === 'ArrowLeft' ? -0.012 : 0.012))
    commitMove(before)
  }

  const ordered = [...instances.filter((item) => item.instanceId !== selectedId), ...instances.filter((item) => item.instanceId === selectedId)]

  return (
    <div
      ref={containerRef}
      data-necklace-canvas
      className={`builder-stage aspect-[1.24] w-full sm:aspect-[1000/580] ${justDropped ? 'is-drop-target' : ''}`}
      onPointerDown={(event) => { if (event.target === event.currentTarget) selectInstance(null) }}
    >
      <div className="pointer-events-none absolute left-3 top-3 z-10 inline-flex items-center gap-1.5 rounded-full border border-rose/35 bg-white/75 px-3 py-1.5 text-[9px] uppercase tracking-[0.14em] text-burgundy backdrop-blur sm:left-5 sm:top-5">
        <Move size={11} /> Touch · drag · arrange
      </div>
      <svg
        ref={svgRef}
        viewBox={`${view.x} ${view.y} ${view.width} ${view.height}`}
        preserveAspectRatio="xMidYMid meet"
        className="h-full w-full touch-none select-none"
        role="application"
        aria-label="Interactive necklace design canvas. Drag charms along the gold chain. Use arrow keys to move a selected charm and Delete to remove it."
        onPointerDown={(event) => { if (event.target === event.currentTarget) selectInstance(null) }}
      >
        <defs>
          <linearGradient id="necklaceGold" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#9A6A20" />
            <stop offset=".18" stopColor="#F4DE9C" />
            <stop offset=".38" stopColor="#B68129" />
            <stop offset=".58" stopColor="#F5E5B2" />
            <stop offset=".8" stopColor="#B9862F" />
            <stop offset="1" stopColor="#E9C66F" />
          </linearGradient>
          <filter id="chainShadow" x="-15%" y="-15%" width="130%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#80601E" floodOpacity=".25" />
          </filter>
          <filter id="selectedGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="#8D1528" floodOpacity=".24" />
          </filter>
        </defs>

        <g transform={`translate(${ZOOM_CENTER.x} ${ZOOM_CENTER.y}) scale(${zoom}) translate(${-ZOOM_CENTER.x} ${-ZOOM_CENTER.y})`}>
          {/* Delicate layered chain creates a metallic, linked appearance. */}
          <path d="M82 -10 Q122 438 500 428 Q878 438 918 -10" fill="none" stroke="#8B601D" strokeWidth="10" strokeLinecap="round" opacity=".28" filter="url(#chainShadow)" />
          <path d="M82 -10 Q122 438 500 428 Q878 438 918 -10" fill="none" stroke="url(#necklaceGold)" strokeWidth="7" strokeLinecap="round" />
          <path d="M82 -10 Q122 438 500 428 Q878 438 918 -10" fill="none" stroke="#FFF2C8" strokeWidth="1.8" strokeLinecap="round" opacity=".8" />
          <path d="M82 -10 Q122 438 500 428 Q878 438 918 -10" fill="none" stroke="#7B5018" strokeWidth="1.2" strokeDasharray="1 10" strokeLinecap="round" opacity=".8" />

          <g opacity=".95">
            <circle cx="86" cy="18" r="13" fill="none" stroke="url(#necklaceGold)" strokeWidth="6" />
            <path d="M78 18 h16" stroke="#FFF2C8" strokeWidth="1" />
            <circle cx="914" cy="18" r="10" fill="none" stroke="url(#necklaceGold)" strokeWidth="5" />
            <path d="M904 18 h20" stroke="url(#necklaceGold)" strokeWidth="4" strokeLinecap="round" />
          </g>

          {instances.length === 0 && (
            <g className="pointer-events-none" opacity=".72">
              <circle cx="500" cy="265" r="54" fill="#FFFFFF" opacity=".42" stroke="#E9A6C5" strokeDasharray="4 7" />
              <path d="M480 265 h40 M500 245 v40" stroke="#D77FA9" strokeWidth="2" strokeLinecap="round" />
              <text x="500" y="342" textAnchor="middle" fill="#8A7A73" fontSize="15" letterSpacing="2">ADD YOUR FIRST CHARM</text>
            </g>
          )}

          {ordered.map((instance) => {
            const product = productMap.get(instance.productId)
            if (!product) return null
            const point = pointOnNecklace(instance.t)
            const selected = instance.instanceId === selectedId
            return (
              <g
                key={instance.instanceId}
                role="button"
                tabIndex={0}
                aria-label={`${product.name}, selected on necklace. Drag or use left and right arrow keys to move; press Delete to remove.`}
                aria-pressed={selected}
                className="charm-node"
                transform={`translate(${point.x} ${point.y})`}
                onPointerDown={(event) => startDrag(event, instance)}
                onPointerMove={dragCharm}
                onPointerUp={endDrag}
                onPointerCancel={endDrag}
                onFocus={() => selectInstance(instance.instanceId)}
                onKeyDown={(event) => keyboardMove(event, instance, product.name)}
                filter={selected ? 'url(#selectedGlow)' : undefined}
              >
                <circle className="charm-focus-ring" cx="0" cy="37" r="52" fill="none" stroke="#8D1528" strokeWidth="3" strokeDasharray="4 4" />
                {selected && <circle cx="0" cy="37" r="50" fill="#FFFFFF" fillOpacity=".18" stroke="#8D1528" strokeWidth="2" strokeDasharray="4 4" />}
                <rect x="-53" y="-8" width="106" height="108" rx="45" fill="transparent" />
                <image href={artUrl(product.image_url)} x="-57" y="-18" width="114" height="114" preserveAspectRatio="xMidYMid meet" />
                {selected && (
                  <g
                    role="button"
                    aria-label={`Remove ${product.name}`}
                    transform="translate(45 -3)"
                    onPointerDown={(event) => { event.stopPropagation(); event.preventDefault() }}
                    onClick={(event) => { event.stopPropagation(); removeInstance(instance.instanceId); addToast(`${product.name} removed.`, 'info') }}
                    className="cursor-pointer"
                  >
                    <circle r="13" fill="#8D1528" />
                    <path d="M-4 -4 L4 4 M4 -4 L-4 4" stroke="#FFFDF8" strokeWidth="2" strokeLinecap="round" />
                  </g>
                )}
              </g>
            )
          })}
        </g>
      </svg>
      {justDropped && <div className="pointer-events-none absolute inset-0 grid place-items-center bg-rose/5" />}
    </div>
  )
}
