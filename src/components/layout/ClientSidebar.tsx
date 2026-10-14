import { CalendarDays, LogOut } from 'lucide-react'
import { NavLink, useNavigate } from 'react-router-dom'
import { authStore } from '../../store/authStore'
import { SidebarAccount } from './SidebarAccount'

const links = [['/meus-agendamentos', 'Meus agendamentos', CalendarDays]] as const

export function ClientSidebar({ mobileOpen = false, onNavigate }: { mobileOpen?: boolean; onNavigate?: () => void }) {
  const navigate = useNavigate()

  function handleLogout() {
    authStore.getState().clearSession()
    navigate('/login', { replace: true })
  }

  return (
    <aside className="client-sidebar" id="client-sidebar" aria-label="Navegação do cliente" role={mobileOpen ? 'dialog' : undefined} aria-modal={mobileOpen ? true : undefined}>
      <div className="client-sidebar-brand" aria-label="Agenda+">
        <span className="brand-mark" aria-hidden="true">+</span>
        <span className="brand-name">Agenda<span>+</span></span>
      </div>
      <NavLink
        className={({ isActive }) => isActive ? 'client-new-appointment client-nav-link--active' : 'client-new-appointment'}
        to="/agendar"
        onClick={onNavigate}
      >
        <CalendarDays size={20} strokeWidth={1.8} aria-hidden="true" />
        <span>Novo agendamento</span>
      </NavLink>
      <nav aria-label="Área do cliente">
        {links.map(([to, label, Icon]) => (
          <NavLink
            key={to}
            to={to}
            end
            onClick={onNavigate}
            className={({ isActive }) => isActive ? 'client-nav-link client-nav-link--active' : 'client-nav-link'}
          >
            <Icon size={20} strokeWidth={1.8} aria-hidden="true" />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="sidebar-footer">
        <SidebarAccount />
        <button className="client-logout" type="button" onClick={handleLogout}>
          <LogOut size={19} strokeWidth={1.8} aria-hidden="true" />
          <span>Sair</span>
        </button>
      </div>
    </aside>
  )
}
