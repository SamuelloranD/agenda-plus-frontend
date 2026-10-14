import { ArrowLeft, Menu } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

interface HeaderProps {
  title?: string
  subtitle?: string
  sidebarOpen?: boolean
  sidebarId?: string
  onMenuClick?: () => void
  backTo?: string
  backLabel?: string
  actions?: ReactNode
}

export function Header({ title = 'Painel administrativo', subtitle = 'O ritmo do seu estúdio, em um só lugar.', sidebarOpen = false, sidebarId, onMenuClick, backTo, backLabel, actions }: HeaderProps) {
  return (
    <header className="admin-header">
      {!sidebarOpen && <button className="admin-menu-button admin-menu-button--editorial" type="button" aria-label="Abrir navegação" aria-expanded={sidebarOpen} aria-controls={sidebarId} onClick={onMenuClick}><Menu size={20} strokeWidth={1.8} aria-hidden="true" /></button>}
      <div>{backTo ? <Link className="professional-editor-back" to={backTo}><ArrowLeft size={18} aria-hidden="true" />{backLabel}</Link> : <p className="admin-eyebrow">Agenda+</p>}<h1>{title}</h1><p>{subtitle}</p></div>
      {actions && <div className="admin-header__actions">{actions}</div>}
    </header>
  )
}
