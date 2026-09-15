interface HeaderProps { title?: string; subtitle?: string; onMenuClick?: () => void }

export function Header({ title = 'Painel administrativo', subtitle = 'O ritmo do seu estúdio, em um só lugar.', onMenuClick }: HeaderProps) {
  return <header className="admin-header">
    <button className="admin-menu-button" type="button" aria-label="Abrir navegação" onClick={onMenuClick}>☰</button>
    <div><p className="admin-eyebrow">Agenda+</p><h1>{title}</h1><p>{subtitle}</p></div>
  </header>
}
