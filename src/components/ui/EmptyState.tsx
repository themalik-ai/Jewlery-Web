import type { LucideIcon } from 'lucide-react'
import { Link } from 'react-router-dom'

export function EmptyState({ icon: Icon, title, description, action, to }: { icon: LucideIcon; title: string; description: string; action?: string; to?: string }) {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-16 text-center">
      <span className="grid h-14 w-14 place-items-center rounded-full bg-blush text-burgundy"><Icon size={23} strokeWidth={1.5} /></span>
      <h2 className="mt-5 font-display text-3xl">{title}</h2>
      <p className="mt-2 text-sm leading-relaxed text-muted">{description}</p>
      {action && to && <Link to={to} className="btn-primary mt-6">{action}</Link>}
    </div>
  )
}
