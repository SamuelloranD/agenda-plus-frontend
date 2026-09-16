import type { ReactNode } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { AdminShell } from '../components/layout/AdminShell'
import { DashboardPage } from '../pages/DashboardPage'
import { LoginPage } from '../pages/LoginPage'
import { NewAppointmentPage } from '../pages/NewAppointmentPage'
import { ProfessionalsPage } from '../pages/ProfessionalsPage'
import { RegisterPage } from '../pages/RegisterPage'
import { ServicesPage } from '../pages/ServicesPage'
import { WeeklyAgendaPage } from '../pages/WeeklyAgendaPage'
import { ProtectedRoute, type AdminSession } from './ProtectedRoute'

interface AppRoutesProps {
  session?: AdminSession | null
}

function ClientBookingPlaceholder() {
  return <section className="route-page"><header className="topbar"><div className="brand-lockup" aria-label="Agenda+"><span className="brand-mark" aria-hidden="true">+</span><span className="brand-name">Agenda<span>+</span></span></div><span className="edition-label">CADERNO DE ATENDIMENTO</span></header><section className="route-sheet" aria-labelledby="booking-title"><p className="eyebrow">RESERVA ONLINE</p><h1 id="booking-title">Agendar horário</h1><p className="intro">Escolha seu serviço, profissional e melhor horário.</p></section></section>
}

function AdminRoute({ title, subtitle, children, session }: { title: string; subtitle: string; children: ReactNode; session?: AdminSession | null }) {
  return <ProtectedRoute session={session}><AdminShell title={title} subtitle={subtitle}>{children}</AdminShell></ProtectedRoute>
}

export function AppRoutes({ session }: AppRoutesProps) {
  return <Routes>
    <Route path="/" element={<Navigate to="/login" replace />} />
    <Route path="/login" element={<LoginPage />} />
    <Route path="/cadastro" element={<RegisterPage />} />
    <Route path="/agendar/*" element={<ClientBookingPlaceholder />} />
    <Route path="/painel" element={<ProtectedRoute session={session}><AdminShell title="Painel" subtitle="Visão geral do seu estúdio."><DashboardPage /></AdminShell></ProtectedRoute>} />
    <Route path="/painel/agenda" element={<ProtectedRoute session={session}><AdminShell title="Agenda semanal" subtitle="Organize a semana de atendimentos."><WeeklyAgendaPage /></AdminShell></ProtectedRoute>} />
    <Route path="/painel/profissionais" element={<AdminRoute session={session} title="Profissionais" subtitle="Cuide da equipe do seu estúdio."><ProfessionalsPage /></AdminRoute>} />
    <Route path="/painel/servicos" element={<AdminRoute session={session} title="Serviços" subtitle="Organize o catálogo de serviços."><ServicesPage /></AdminRoute>} />
    <Route path="/painel/agendamentos/novo" element={<AdminRoute session={session} title="Novo agendamento" subtitle="Reserve um horário para seu cliente."><NewAppointmentPage /></AdminRoute>} />
    <Route path="*" element={<Navigate to="/login" replace />} />
  </Routes>
}
