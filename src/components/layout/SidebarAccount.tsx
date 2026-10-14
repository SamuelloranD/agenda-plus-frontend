import { useAuthStore } from '../../store/authStore'

export function SidebarAccount() {
  const user = useAuthStore((state) => state.user)
  if (!user) return null

  const initials = user.nome.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase()

  return (
    <div className="sidebar-account">
      <span className="sidebar-account__avatar" aria-hidden="true">{initials}</span>
      <div className="sidebar-account__identity">
        <span className="sidebar-account__name">{user.nome}</span>
        <span className="sidebar-account__role">{user.role === 'ADMIN' ? 'Administrador' : 'Cliente'}</span>
      </div>
    </div>
  )
}
