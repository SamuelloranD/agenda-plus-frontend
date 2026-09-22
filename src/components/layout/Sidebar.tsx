import { NavLink, useNavigate } from 'react-router-dom'
import { authStore } from '../../store/authStore'

const links = [
  ['/painel', 'Vis\u00e3o geral'],
  ['/painel/agenda', 'Agenda'],
  ['/painel/profissionais', 'Profissionais'],
  ['/painel/servicos', 'Servi\u00e7os'],
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
    <nav>{links.map(([to, label]) => <NavLink key={to} to={to} end={to === '/painel'} className={({ isActive }) => isActive ? 'admin-nav-link admin-nav-link--active' : 'admin-nav-link'}>{label}</NavLink>)}</nav>
    <button className="admin-logout" type="button" onClick={handleLogout}>Sair</button>
  </aside>
}
