import { useCallback, useEffect, useRef, useState } from 'react'

export function useSidebarDialog(sidebarId: string) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const shellRef = useRef<HTMLDivElement>(null)
  const wasOpened = useRef(false)
  const closeSidebar = useCallback(() => setSidebarOpen(false), [])

  useEffect(() => {
    if (!sidebarOpen) {
      if (wasOpened.current) shellRef.current?.querySelector<HTMLButtonElement>('.admin-menu-button')?.focus()
      return
    }

    wasOpened.current = true
    const sidebar = shellRef.current?.querySelector<HTMLElement>(`#${sidebarId}`)
    const focusable = () => Array.from(sidebar?.querySelectorAll<HTMLElement>('a[href], button:not([disabled])') ?? [])
    focusable()[0]?.focus()
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()
        closeSidebar()
      }
      if (event.key !== 'Tab') return
      const items = focusable()
      if (!items.length) return
      const first = items[0]
      const last = items[items.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = previousOverflow
    }
  }, [sidebarId, sidebarOpen, closeSidebar])

  useEffect(() => {
    const onResize = () => { if (window.innerWidth >= 1024) closeSidebar() }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [closeSidebar])

  return { sidebarOpen, setSidebarOpen, closeSidebar, shellRef }
}
