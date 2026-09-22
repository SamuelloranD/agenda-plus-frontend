import { useEffect, useState, type ReactNode } from 'react'
import { Header } from './Header'
import { Sidebar } from './Sidebar'

export function AdminShell({ children, title, subtitle }: { children: ReactNode; title?: string; subtitle?: string }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const closeSidebar = () => setSidebarOpen(false)

  useEffect(() => {
    if (!sidebarOpen) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeSidebar()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [sidebarOpen])

  return <div className={`admin-shell${sidebarOpen ? ' sidebar-open' : ''}`}>
    <style>{adminShellStyles}</style><style>{reducedMotionStyles}</style>
    <Sidebar />
    {sidebarOpen && <button className="sidebar-overlay" data-testid="sidebar-overlay" type="button" aria-label="Fechar navegação" onClick={closeSidebar} />}
    <main className="admin-main"><Header title={title} subtitle={subtitle} sidebarOpen={sidebarOpen} onMenuClick={sidebarOpen ? closeSidebar : () => setSidebarOpen(true)} />{children}</main>
  </div>
}

const adminShellStyles = `
.admin-shell{min-height:100svh;display:block;color:var(--ink);background:var(--paper)}
.admin-sidebar{position:fixed;inset:0 auto 0 0;z-index:3;width:250px;box-sizing:border-box;overflow-y:auto;padding:28px 20px}.admin-sidebar-brand{display:flex;align-items:center;gap:10px;margin:0 10px 28px}
.admin-sidebar .brand-mark{color:var(--paper);background:var(--terracotta);border-color:var(--terracotta)}.admin-sidebar .brand-name span{color:var(--terracotta)}
.admin-new-appointment{display:block;margin:0 0 22px;padding:12px 14px;color:#fff!important;background:var(--terracotta);border:1px solid var(--terracotta)!important;border-radius:4px;text-align:center!important;font-size:13px;line-height:1.4;text-decoration:none;font-weight:700!important}.admin-new-appointment:hover{background:#a6472e!important}
.primary-action{padding:13px 18px;color:#fff;background:var(--terracotta);border:1px solid var(--terracotta);border-radius:4px;box-shadow:0 3px 8px rgb(145 61 36 / 16%);cursor:pointer;font-weight:700}.primary-action:hover:not(:disabled){background:#a6472e}.primary-action:disabled{opacity:.65;cursor:wait}
.admin-sidebar nav{display:grid;gap:7px}.admin-sidebar nav a{display:flex;align-items:center;gap:10px;padding:12px 14px;color:var(--muted-ink);text-decoration:none;border:1px solid transparent;border-radius:4px;font-size:13px}.admin-sidebar nav a:hover{background:color-mix(in srgb,var(--paper) 75%,var(--line));border-color:var(--line)}.admin-sidebar nav a.admin-nav-link--active{color:var(--olive);background:color-mix(in srgb,var(--paper) 82%,var(--mustard));border-color:var(--line);box-shadow:inset 3px 0 var(--terracotta);font-weight:700}
.admin-logout{display:flex;align-items:center;gap:10px;width:100%;margin-top:28px;padding:11px 14px;color:var(--muted-ink);background:transparent;border:1px solid var(--line);border-radius:4px;cursor:pointer;font-size:12px;font-weight:700;letter-spacing:.08em;text-align:left;text-transform:uppercase}.admin-logout:hover{color:var(--terracotta);border-color:var(--terracotta);background:color-mix(in srgb,var(--paper) 82%,var(--terracotta))}
.admin-main{position:relative;min-width:0;min-height:100svh;margin-left:250px;padding:32px clamp(24px,5vw,72px)}.admin-header{position:relative;z-index:auto;display:flex;align-items:flex-start;gap:18px;margin-bottom:42px}.admin-header h1{font-size:clamp(38px,5vw,64px)}.admin-header p{margin:8px 0 0;color:var(--muted-ink)}.admin-eyebrow{color:var(--terracotta)!important;font-size:10px;letter-spacing:.18em;text-transform:uppercase;font-weight:700}
.admin-menu-button{position:relative;z-index:4;width:44px;height:44px;display:none;align-items:center;justify-content:center;padding:0;color:var(--terracotta);background:var(--paper);border:1px solid var(--line);border-radius:4px;box-shadow:none;cursor:pointer;line-height:1}.sidebar-open .admin-sidebar{transform:translateX(0)}.sidebar-overlay{display:none}
@media(max-width:760px){.admin-shell{display:block}.admin-sidebar{transform:translateX(-100%);transition:transform .2s}.admin-main{margin-left:0;padding:24px 20px}.admin-menu-button{display:flex}.admin-header h1{font-size:42px}.sidebar-overlay{position:fixed;inset:0;z-index:2;display:block;border:0;background:rgb(31 31 30 / 18%)}.sidebar-open .admin-sidebar{transform:translateX(0)}}
`

const reducedMotionStyles = '@media(prefers-reduced-motion:reduce){.admin-sidebar{transition:none!important}}'
