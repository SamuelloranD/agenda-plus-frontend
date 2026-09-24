import { useEffect, useRef, useState, type ReactNode, type TouchEvent } from 'react'
import { Header } from './Header'
import { Sidebar } from './Sidebar'

export function AdminShell({ children, title, subtitle }: { children: ReactNode; title?: string; subtitle?: string }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const touchStartX = useRef<number | null>(null)
  const closeSidebar = () => setSidebarOpen(false)

  function handleTouchStart(event: TouchEvent) {
    if (sidebarOpen) touchStartX.current = event.changedTouches[0]?.clientX ?? null
  }

  function handleTouchEnd(event: TouchEvent) {
    const start = touchStartX.current
    touchStartX.current = null
    if (sidebarOpen && start !== null && start - (event.changedTouches[0]?.clientX ?? start) > 50) closeSidebar()
  }

  useEffect(() => {
    if (!sidebarOpen) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeSidebar()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [sidebarOpen])

  return (
    <div className={`admin-shell${sidebarOpen ? ' sidebar-open' : ''}`} onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
      <Sidebar />
      {sidebarOpen && <button className="sidebar-overlay" data-testid="sidebar-overlay" type="button" aria-label="Fechar navegação" onClick={closeSidebar} />}
      <main className="admin-main">
        <Header
          title={title}
          subtitle={subtitle}
          sidebarOpen={sidebarOpen}
          sidebarId="admin-sidebar"
          onMenuClick={sidebarOpen ? closeSidebar : () => setSidebarOpen(true)}
        />
        {children}
      </main>
    </div>
  )
}
