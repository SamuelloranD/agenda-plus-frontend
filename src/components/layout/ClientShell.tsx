import { useEffect, useRef, useState, type ReactNode, type TouchEvent } from 'react'
import { ClientSidebar } from './ClientSidebar'
import { Header } from './Header'

interface ClientShellProps {
  children: ReactNode
  title: string
  subtitle: string
}

export function ClientShell({ children, title, subtitle }: ClientShellProps) {
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
    <div className={`client-shell${sidebarOpen ? ' sidebar-open' : ''}`} onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
    <style>{clientShellStyles}</style><style>{reducedMotionStyles}</style>
      <ClientSidebar />
      {sidebarOpen && (
        <button
          className="client-sidebar-overlay client-sidebar-overlay--opaque"
          data-testid="client-sidebar-overlay"
          type="button"
          aria-label="Fechar navegação"
          onClick={closeSidebar}
        />
      )}
      <main className="client-main" aria-label={title}>
        <Header
          title={title}
          subtitle={subtitle}
          sidebarOpen={sidebarOpen}
          onMenuClick={sidebarOpen ? closeSidebar : () => setSidebarOpen(true)}
        />
        {children}
      </main>
    </div>
  )
}

const clientShellStyles = `
.client-shell{min-height:100svh;display:block;color:var(--ink);background:var(--paper)}
.client-sidebar{position:fixed;inset:0 auto 0 0;z-index:3;width:250px;box-sizing:border-box;overflow-y:auto;padding:28px 20px;background:var(--paper);border-right:1px solid var(--line)}
.client-sidebar-brand{display:flex;align-items:center;gap:10px;margin:0 10px 28px}.client-sidebar .brand-mark{color:var(--paper);background:var(--terracotta);border-color:var(--terracotta)}.client-sidebar .brand-name span{color:var(--terracotta)}
.client-sidebar nav{display:grid;gap:7px}.client-sidebar nav a{padding:12px 14px;color:var(--muted-ink);text-decoration:none;border:1px solid transparent;border-radius:4px;font-size:13px}.client-sidebar nav a:hover{background:color-mix(in srgb,var(--paper) 75%,var(--line));border-color:var(--line)}.client-sidebar nav a.client-nav-link--active{color:var(--olive);background:color-mix(in srgb,var(--paper) 82%,var(--mustard));border-color:var(--line);box-shadow:inset 3px 0 var(--terracotta);font-weight:700}
.client-logout{width:100%;margin-top:28px;padding:11px 14px;color:var(--muted-ink);background:transparent;border:1px solid var(--line);border-radius:4px;cursor:pointer;font-size:12px;font-weight:700;letter-spacing:.08em;text-align:left;text-transform:uppercase}.client-logout:hover{color:var(--terracotta);border-color:var(--terracotta);background:color-mix(in srgb,var(--paper) 82%,var(--terracotta))}
.client-main{position:relative;min-width:0;min-height:100svh;margin-left:250px;padding:32px clamp(24px,5vw,72px)}.client-shell .admin-header{position:relative;z-index:auto;display:flex;align-items:flex-start;gap:18px;margin-bottom:42px}.client-shell .admin-header h1{font-size:clamp(38px,5vw,64px)}.client-shell .admin-header p{margin:8px 0 0;color:var(--muted-ink)}.client-shell .admin-eyebrow{color:var(--terracotta)!important;font-size:10px;letter-spacing:.18em;text-transform:uppercase;font-weight:700}
.client-shell .admin-menu-button{position:relative;z-index:4;width:44px;height:44px;display:none;align-items:center;justify-content:center;padding:0;color:var(--terracotta);background:var(--paper);border:1px solid var(--line);border-radius:4px;box-shadow:none;cursor:pointer;line-height:1}.client-sidebar-overlay{display:none}
@media(max-width:760px){.client-shell{display:block}.client-sidebar{transform:translateX(-100%);transition:transform .2s}.client-main{margin-left:0;padding:24px 20px}.client-shell .admin-menu-button{display:flex}.client-shell .admin-header h1{font-size:42px}.client-sidebar-overlay{position:fixed;inset:0;z-index:2;display:block;border:0;background:rgb(31 31 30 / 72%)}.client-shell.sidebar-open .client-sidebar{transform:translateX(0)}}
`

const reducedMotionStyles = '@media(prefers-reduced-motion:reduce){.client-sidebar{transition:none!important}}'
