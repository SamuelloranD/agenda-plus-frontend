import { NavLink, useNavigate } from "react-router-dom";
import { CalendarDays, House, Layers3, LogOut, UserRound } from "lucide-react";
import { authStore } from "../../store/authStore";
import { SidebarAccount } from './SidebarAccount';

const links = [
  ["/painel", "Vis\u00e3o geral", House],
  ["/painel/agenda", "Agenda", CalendarDays],
  ["/painel/profissionais", "Profissionais", UserRound],
  ["/painel/servicos", "Servi\u00e7os", Layers3],
] as const;

export function Sidebar({ mobileOpen = false, onNavigate }: { mobileOpen?: boolean; onNavigate?: () => void }) {
  const navigate = useNavigate();

  function handleLogout() {
    authStore.getState().clearSession();
    navigate("/login", { replace: true });
  }

  return (
    <aside
      className="admin-sidebar admin-sidebar--paper"
      id="admin-sidebar"
      aria-label={"Navega\u00e7\u00e3o administrativa"}
      role={mobileOpen ? 'dialog' : undefined}
      aria-modal={mobileOpen ? true : undefined}
    >
      <div className="admin-sidebar-brand">
        <span className="brand-mark">+</span>
        <span className="brand-name">
          Agenda<span>+</span>
        </span>
      </div>
      <NavLink to="/painel/agendamentos/novo" className="admin-new-appointment" onClick={onNavigate}>
        <span>Novo agendamento</span>
      </NavLink>
      <nav aria-label="Área administrativa">
        {links.map(([to, label, Icon]) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/painel"}
            onClick={onNavigate}
            className={({ isActive }) =>
              isActive
                ? "admin-nav-link admin-nav-link--active"
                : "admin-nav-link"
            }
          >
            <Icon size={20} strokeWidth={1.8} aria-hidden="true" />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="sidebar-footer">
        <SidebarAccount />
        <button className="admin-logout" type="button" onClick={handleLogout}>
          <LogOut size={19} strokeWidth={1.8} aria-hidden="true" />
          <span>Sair</span>
        </button>
      </div>
    </aside>
  );
}
