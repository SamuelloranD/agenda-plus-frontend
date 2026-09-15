import { useState, type ReactNode } from 'react'
import { Header } from './Header'
import { Sidebar } from './Sidebar'

export function AdminShell({ children, title, subtitle }: { children: ReactNode; title?: string; subtitle?: string }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  return <div className={`admin-shell${sidebarOpen ? ' sidebar-open' : ''}`}>
    <style>{`.admin-shell{min-height:100svh;display:grid;grid-template-columns:250px 1fr;color:var(--ink);background:var(--paper)}.admin-sidebar{padding:28px 20px;background:var(--olive);color:var(--paper)}.admin-sidebar-brand{display:flex;align-items:center;gap:10px;margin:0 10px 48px}.admin-sidebar .brand-mark{color:var(--olive);background:var(--mustard);border-color:var(--paper)}.admin-sidebar .brand-name span{color:var(--mustard)}.admin-sidebar nav{display:grid;gap:7px}.admin-sidebar nav a{padding:12px 14px;color:inherit;text-decoration:none;border-radius:4px;font-size:13px}.admin-sidebar nav a.active,.admin-sidebar nav a:hover{background:rgb(255 255 255 / 14%)}.admin-main{min-width:0;padding:32px clamp(24px,5vw,72px)}.admin-header{display:flex;align-items:flex-start;gap:18px;margin-bottom:42px}.admin-header h1{font-size:clamp(38px,5vw,64px)}.admin-header p{margin:8px 0 0;color:var(--muted-ink)}.admin-eyebrow{color:var(--terracotta)!important;font-size:10px;letter-spacing:.18em;text-transform:uppercase;font-weight:700}.admin-menu-button{display:none}.sidebar-open .admin-sidebar{transform:translateX(0)}@media(max-width:760px){.admin-shell{display:block}.admin-sidebar{position:fixed;inset:0 auto 0 0;width:250px;z-index:2;transform:translateX(-100%);transition:transform .2s}.admin-main{padding:24px 20px}.admin-menu-button{display:block;padding:8px 10px;color:var(--olive);background:transparent;border:1px solid var(--line);cursor:pointer}.admin-header h1{font-size:42px}}`}</style>
    <Sidebar /><main className="admin-main"><Header title={title} subtitle={subtitle} onMenuClick={() => setSidebarOpen((open) => !open)} />{children}</main>
  </div>
}
