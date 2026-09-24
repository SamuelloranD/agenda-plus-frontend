import { Calendar, LogOut } from 'lucide-react'
import { NavLink, useNavigate } from 'react-router-dom'
import { authStore } from '../../store/authStore'

const links = [['/meus-agendamentos', 'Meus agendamentos', Calendar]] as const

export function ClientSidebar() {
  const navigate = useNavigate()

  function handleLogout() {
    authStore.getState().clearSession()
    navigate('/login', { replace: true })
  }

  return (
    <aside className="client-sidebar" id="client-sidebar" aria-label="Navegação do cliente">
      <div className="client-sidebar-brand" aria-label="Agenda+">
        <span className="brand-mark" aria-hidden="true">+</span>
        <span className="brand-name">Agenda<span>+</span></span>
      </div>
      <NavLink
        className={({ isActive }) => isActive ? 'client-new-appointment client-nav-link--active' : 'client-new-appointment'}
        to="/agendar"
      >
        Novo agendamento
      </NavLink>
      <nav aria-label="Área do cliente">
        {links.map(([to, label, Icon]) => (
          <NavLink
            key={to}
            to={to}
            end
            className={({ isActive }) => isActive ? 'client-nav-link client-nav-link--active' : 'client-nav-link'}
          >
            <Icon size={16} strokeWidth={1.8} aria-hidden="true" />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
      <button className="client-logout" type="button" onClick={handleLogout}>
        <LogOut size={16} strokeWidth={1.8} aria-hidden="true" />
        <span>Sair</span>
      </button>
    </aside>
  )
}
