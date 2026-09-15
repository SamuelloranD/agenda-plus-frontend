interface HeaderProps { title?: string; subtitle?: string; sidebarOpen?: boolean; onMenuClick?: () => void }

export function Header({ title = 'Painel administrativo', subtitle = 'O ritmo do seu est\u00fadio, em um s\u00f3 lugar.', sidebarOpen = false, onMenuClick }: HeaderProps) {
  return <header className="admin-header">
    <button className="admin-menu-button admin-menu-button--editorial" type="button" aria-label={sidebarOpen ? 'Fechar navega\u00e7\u00e3o' : 'Abrir navega\u00e7\u00e3o'} aria-expanded={sidebarOpen} onClick={onMenuClick}>{sidebarOpen ? '\u00d7' : '\u2630'}</button>
    <div><p className="admin-eyebrow">Agenda+</p><h1>{title}</h1><p>{subtitle}</p></div>
  </header>
}
