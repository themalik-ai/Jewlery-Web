import { useEffect } from 'react'

export function usePageTitle(title: string, description?: string) {
  useEffect(() => {
    document.title = title ? `${title} — SCARLET` : 'SCARLET — Charms & Custom Necklaces'
    if (description) {
      let element = document.querySelector<HTMLMetaElement>('meta[name="description"]')
      if (!element) {
        element = document.createElement('meta')
        element.name = 'description'
        document.head.appendChild(element)
      }
      element.content = description
    }
  }, [title, description])
}

export function useLockBodyScroll(locked: boolean) {
  useEffect(() => {
    if (!locked) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = previous }
  }, [locked])
}
