import { Menu } from 'lucide-react'

interface HeaderProps { title?: string; subtitle?: string; sidebarOpen?: boolean; onMenuClick?: () => void }

export function Header({ title = 'Painel administrativo', subtitle = 'O ritmo do seu est\u00fadio, em um s\u00f3 lugar.', sidebarOpen = false, onMenuClick }: HeaderProps) {
  return <header className="admin-header">
    {!sidebarOpen && <button className="admin-menu-button admin-menu-button--editorial" type="button" aria-label="Abrir navegação" aria-expanded={false} onClick={onMenuClick}><Menu size={20} strokeWidth={1.8} aria-hidden="true" /></button>}
    <div><p className="admin-eyebrow">Agenda+</p><h1>{title}</h1><p>{subtitle}</p></div>
  </header>
}
