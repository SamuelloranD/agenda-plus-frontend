import { useRef, type ReactNode, type TouchEvent } from 'react'
import { Header } from './Header'
import { Sidebar } from './Sidebar'
import { useSidebarDialog } from './useSidebarDialog'

export function AdminShell({ children, title, subtitle, backTo, backLabel }: { children: ReactNode; title?: string; subtitle?: string; backTo?: string; backLabel?: string }) {
  const { sidebarOpen, setSidebarOpen, closeSidebar, shellRef } = useSidebarDialog('admin-sidebar')
  const touchStartX = useRef<number | null>(null)

  function handleTouchStart(event: TouchEvent) {
    if (sidebarOpen) touchStartX.current = event.changedTouches[0]?.clientX ?? null
  }

  function handleTouchEnd(event: TouchEvent) {
    const start = touchStartX.current
    touchStartX.current = null
    if (sidebarOpen && start !== null && start - (event.changedTouches[0]?.clientX ?? start) > 50) closeSidebar()
  }

  return (
    <div ref={shellRef} className={`admin-shell${sidebarOpen ? ' sidebar-open' : ''}`} onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
      <Sidebar mobileOpen={sidebarOpen} onNavigate={closeSidebar} />
      {sidebarOpen && <button className="sidebar-overlay" data-testid="sidebar-overlay" type="button" aria-label="Fechar navegação" onClick={closeSidebar} />}
      <main className="admin-main" inert={sidebarOpen}>
        <Header
          title={title}
          subtitle={subtitle}
          backTo={backTo}
          backLabel={backLabel}
          sidebarOpen={sidebarOpen}
          sidebarId="admin-sidebar"
          onMenuClick={sidebarOpen ? closeSidebar : () => setSidebarOpen(true)}
        />
        {children}
      </main>
    </div>
  )
}
