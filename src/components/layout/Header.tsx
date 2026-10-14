import { Menu } from 'lucide-react'
import type { ReactNode } from 'react'

interface HeaderProps {
  title?: string
  subtitle?: string
  sidebarOpen?: boolean
  sidebarId?: string
  onMenuClick?: () => void
  right?: ReactNode
}

export function Header({ title = 'Painel administrativo', subtitle = 'O ritmo do seu estúdio, em um só lugar.', sidebarOpen = false, sidebarId, onMenuClick, right }: HeaderProps) {
  return (
    <header className="admin-header">
      {!sidebarOpen && (
        <button
          className="admin-menu-button admin-menu-button--editorial"
          type="button"
          aria-label="Abrir navegação"
          aria-expanded={sidebarOpen}
          aria-controls={sidebarId}
          onClick={onMenuClick}
        >
          <Menu size={20} strokeWidth={1.8} aria-hidden="true" />
        </button>
      )}
      <div><p className="admin-eyebrow">Agenda+</p><h1>{title}</h1><p>{subtitle}</p></div>
      {right}
    </header>
  )
}
