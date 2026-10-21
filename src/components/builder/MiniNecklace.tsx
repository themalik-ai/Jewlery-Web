import type { NecklaceCartLine, Product } from '../../lib/types'
import { artUrl, pointOnNecklace } from '../../lib/necklace'

interface Position {
  productId: number
  t: number
  instanceId?: string
}

export function MiniNecklace({ positions, products, className = '' }: { positions: Position[]; products?: Product[]; className?: string }) {
  const productImages = new Map(products?.map((product) => [product.id, product.image_url]) || [])
  return (
    <svg viewBox="0 0 1000 580" className={className} role="img" aria-label={`Custom necklace preview with ${positions.length} charms`}>
      <defs>
        <linearGradient id="miniGold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#a97424" /><stop offset=".3" stopColor="#f2d78d" /><stop offset=".6" stopColor="#b9862f" /><stop offset="1" stopColor="#efd79a" />
        </linearGradient>
      </defs>
      <path d="M82 -10 Q122 438 500 428 Q878 438 918 -10" fill="none" stroke="url(#miniGold)" strokeWidth="8" strokeLinecap="round" />
      <path d="M84 -10 Q124 428 500 418 Q876 428 916 -10" fill="none" stroke="#fff6d9" strokeWidth="1.8" opacity=".8" />
      {positions.map((position, index) => {
        const point = pointOnNecklace(position.t)
        const image = productImages.get(position.productId)
        if (!image) return <circle key={position.instanceId || index} cx={point.x} cy={point.y + 19} r="15" fill="#c9a24b" />
        return (
          <g key={position.instanceId || index}>
            <line x1={point.x} y1={point.y} x2={point.x} y2={point.y + 17} stroke="#c9a24b" strokeWidth="5" />
            <image href={artUrl(image)} x={point.x - 39} y={point.y - 3} width="78" height="78" preserveAspectRatio="xMidYMid meet" />
          </g>
        )
      })}
    </svg>
  )
}

export function MiniNecklaceFromCart({ line, className = '' }: { line: NecklaceCartLine; className?: string }) {
  const imageMap = new Map(line.charms.map((charm) => [charm.productId, charm.image]))
  return (
    <svg viewBox="0 0 1000 580" className={className} role="img" aria-label={`Custom necklace preview with ${line.positions.length} charms`}>
      <defs>
        <linearGradient id="cartMiniGold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#a97424" /><stop offset=".3" stopColor="#f2d78d" /><stop offset=".6" stopColor="#b9862f" /><stop offset="1" stopColor="#efd79a" /></linearGradient>
      </defs>
      <path d="M82 -10 Q122 438 500 428 Q878 438 918 -10" fill="none" stroke="url(#cartMiniGold)" strokeWidth="8" />
      {line.positions.map((position, index) => {
        const point = pointOnNecklace(position.t)
        const image = imageMap.get(position.productId)
        return image ? (
          <g key={position.instanceId || index}>
            <line x1={point.x} y1={point.y} x2={point.x} y2={point.y + 17} stroke="#c9a24b" strokeWidth="5" />
            <image href={artUrl(image)} x={point.x - 38} y={point.y - 3} width="76" height="76" />
          </g>
        ) : null
      })}
    </svg>
  )
}
