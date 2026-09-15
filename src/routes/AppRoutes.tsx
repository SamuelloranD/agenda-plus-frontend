import { Navigate, Route, Routes } from 'react-router-dom'
import { AdminShell } from '../components/layout/AdminShell'
import { LoginPage } from '../pages/LoginPage'
import { RegisterPage } from '../pages/RegisterPage'
import { ProtectedRoute, type AdminSession } from './ProtectedRoute'

interface AppRoutesProps {
  session?: AdminSession | null
}

interface RoutePlaceholderProps {
  eyebrow: string
  title: string
  description: string
  showTitle?: boolean
}

function RoutePlaceholder({ eyebrow, title, description, showTitle = true }: RoutePlaceholderProps) {
  return (
    <section className="route-page">
      <header className="topbar">
        <div className="brand-lockup" aria-label="Agenda+">
          <span className="brand-mark" aria-hidden="true">+</span>
          <span className="brand-name">Agenda<span>+</span></span>
        </div>
        <span className="edition-label">CADERNO DE ATENDIMENTO</span>
      </header>
      <section className="route-sheet" aria-labelledby={showTitle ? 'route-title' : undefined}>
        <p className="eyebrow">{eyebrow}</p>
        {showTitle && <h1 id="route-title">{title}</h1>}
        <p className="intro">{description}</p>
      </section>
    </section>
  )
}

const protectedRoutes = [
  ['/painel', 'Painel', 'Visão geral do seu estúdio.'],
  ['/painel/agenda', 'Agenda', 'Organize a semana de atendimentos.'],
  ['/painel/profissionais', 'Profissionais', 'Cuide da equipe do seu estúdio.'],
  ['/painel/servicos', 'Serviços', 'Organize o catálogo de serviços.'],
  ['/painel/agendamentos/novo', 'Novo agendamento', 'Reserve um horário para seu cliente.'],
] as const

export function AppRoutes({ session }: AppRoutesProps) {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/cadastro" element={<RegisterPage />} />
      <Route path="/agendar/*" element={<RoutePlaceholder eyebrow="RESERVA ONLINE" title="Agendar horário" description="Escolha seu serviço, profissional e melhor horário." />} />
      {protectedRoutes.map(([path, title, description]) => (
        <Route
          key={path}
          path={path}
          element={(
            <ProtectedRoute session={session}>
              <AdminShell title={title} subtitle={description}>
              <RoutePlaceholder eyebrow="GESTÃO DO ESTÚDIO" title={title} description={description} showTitle={false} />
              </AdminShell>
            </ProtectedRoute>
          )}
        />
      ))}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}
