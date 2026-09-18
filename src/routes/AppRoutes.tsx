import type { ReactNode } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { AdminShell } from '../components/layout/AdminShell'
import { ClientShell } from '../components/layout/ClientShell'
import { DashboardPage } from '../pages/DashboardPage'
import { ClientBookingPage } from '../pages/ClientBookingPage'
import { ClientAppointmentsPage } from '../pages/ClientAppointmentsPage'
import { LoginPage } from '../pages/LoginPage'
import { NewAppointmentPage } from '../pages/NewAppointmentPage'
import { ProfessionalsPage } from '../pages/ProfessionalsPage'
import { RegisterPage } from '../pages/RegisterPage'
import { ServicesPage } from '../pages/ServicesPage'
import { WeeklyAgendaPage } from '../pages/WeeklyAgendaPage'
import { ClientRoute } from './ClientRoute'
import { ProtectedRoute, type AdminSession } from './ProtectedRoute'

interface AppRoutesProps {
  session?: AdminSession | null
}

function AdminRoute({ title, subtitle, children, session }: { title: string; subtitle: string; children: ReactNode; session?: AdminSession | null }) {
  return <ProtectedRoute session={session}><AdminShell title={title} subtitle={subtitle}>{children}</AdminShell></ProtectedRoute>
}

function ClientBookingRoute({ session }: { session?: AdminSession | null }) {
  const isClient = session?.role === 'CLIENTE'
  const page = <ClientBookingPage embedded={isClient} />

  if (!isClient) return page

  return <ClientShell title="Novo agendamento" subtitle="Escolha um serviço e encontre um horário para você.">{page}</ClientShell>
}

export function AppRoutes({ session }: AppRoutesProps) {
  return <Routes>
    <Route path="/" element={<Navigate to="/login" replace />} />
    <Route path="/login" element={<LoginPage />} />
    <Route path="/cadastro" element={<RegisterPage />} />
    <Route path="/agendar/*" element={<ClientBookingRoute session={session} />} />
    <Route path="/meus-agendamentos" element={<ClientRoute session={session}><ClientShell title="Meus agendamentos" subtitle="Acompanhe seus horários e mantenha sua agenda em dia."><ClientAppointmentsPage /></ClientShell></ClientRoute>} />
    <Route path="/painel" element={<ProtectedRoute session={session}><AdminShell title="Painel" subtitle="Visão geral do seu estúdio."><DashboardPage /></AdminShell></ProtectedRoute>} />
    <Route path="/painel/agenda" element={<ProtectedRoute session={session}><AdminShell title="Agenda semanal" subtitle="Organize a semana de atendimentos."><WeeklyAgendaPage /></AdminShell></ProtectedRoute>} />
    <Route path="/painel/profissionais" element={<AdminRoute session={session} title="Profissionais" subtitle="Cuide da equipe do seu estúdio."><ProfessionalsPage /></AdminRoute>} />
    <Route path="/painel/servicos" element={<AdminRoute session={session} title="Serviços" subtitle="Organize o catálogo de serviços."><ServicesPage /></AdminRoute>} />
    <Route path="/painel/agendamentos/novo" element={<AdminRoute session={session} title="Novo agendamento" subtitle="Reserve um horário para seu cliente."><NewAppointmentPage /></AdminRoute>} />
    <Route path="*" element={<Navigate to="/login" replace />} />
  </Routes>
}
