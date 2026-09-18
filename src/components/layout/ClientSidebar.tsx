import { NavLink, useNavigate } from 'react-router-dom'
import { authStore } from '../../store/authStore'

const links = [
  ['/meus-agendamentos', 'Meus agendamentos'],
  ['/agendar', 'Novo agendamento'],
] as const

export function ClientSidebar() {
  const navigate = useNavigate()

  function handleLogout() {
    authStore.getState().clearSession()
    navigate('/login', { replace: true })
  }

  return (
    <aside className="client-sidebar" aria-label="Navegação do cliente">
      <div className="client-sidebar-brand" aria-label="Agenda+">
        <span className="brand-mark" aria-hidden="true">+</span>
        <span className="brand-name">agenda<span>+</span></span>
      </div>
      <nav aria-label="Área do cliente">
        {links.map(([to, label]) => (
          <NavLink
            key={to}
            to={to}
            end
            className={({ isActive }) => isActive ? 'client-nav-link client-nav-link--active' : 'client-nav-link'}
          >
            {label}
          </NavLink>
        ))}
      </nav>
      <button className="client-logout" type="button" onClick={handleLogout}>Sair</button>
    </aside>
  )
}
