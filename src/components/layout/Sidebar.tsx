import { NavLink, useNavigate } from 'react-router-dom'
import { Calendar, House, IdCardLanyard, Layers, LogOut } from 'lucide-react'
import { authStore } from '../../store/authStore'

const links = [
  ['/painel', 'Vis\u00e3o geral', House],
  ['/painel/agenda', 'Agenda', Calendar],
  ['/painel/profissionais', 'Profissionais', IdCardLanyard],
  ['/painel/servicos', 'Servi\u00e7os', Layers],
] as const

export function Sidebar() {
  const navigate = useNavigate()

  function handleLogout() {
    authStore.getState().clearSession()
    navigate('/login', { replace: true })
  }

  return <aside className="admin-sidebar admin-sidebar--paper" aria-label={'Navega\u00e7\u00e3o administrativa'} style={{ backgroundColor: 'var(--paper)', color: 'var(--ink)', borderRight: '1px solid var(--line)' }}>
    <div className="admin-sidebar-brand"><span className="brand-mark">+</span><span className="brand-name">agenda<span>+</span></span></div>
    <NavLink to="/painel/agendamentos/novo" className="admin-new-appointment">Novo agendamento</NavLink>
    <nav>{links.map(([to, label, Icon]) => <NavLink key={to} to={to} end={to === '/painel'} className={({ isActive }) => isActive ? 'admin-nav-link admin-nav-link--active' : 'admin-nav-link'}><Icon size={16} strokeWidth={1.8} aria-hidden="true" /><span>{label}</span></NavLink>)}</nav>
    <button className="admin-logout" type="button" onClick={handleLogout}><LogOut size={16} strokeWidth={1.8} aria-hidden="true" /><span>Sair</span></button>
  </aside>
}
