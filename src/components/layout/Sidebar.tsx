import { NavLink } from 'react-router-dom'

const links = [
  ['/painel', 'Visão geral'],
  ['/painel/agenda', 'Agenda'],
  ['/painel/profissionais', 'Profissionais'],
  ['/painel/servicos', 'Serviços'],
] as const

export function Sidebar() {
  return <aside className="admin-sidebar" aria-label="Navegação administrativa">
    <div className="admin-sidebar-brand"><span className="brand-mark">+</span><span className="brand-name">agenda<span>+</span></span></div>
    <nav>{links.map(([to, label]) => <NavLink key={to} to={to} end={to === '/painel'}>{label}</NavLink>)}</nav>
  </aside>
}
