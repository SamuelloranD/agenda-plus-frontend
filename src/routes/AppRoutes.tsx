import { Plus } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { AdminShell } from '../components/layout/AdminShell'
import { ClientShell } from '../components/layout/ClientShell'
import { DashboardPage } from '../pages/DashboardPage'
import { ClientBookingPage } from '../pages/ClientBookingPage'
import { ClientAppointmentsPage } from '../pages/ClientAppointmentsPage'
import { LoginPage } from '../pages/LoginPage'
import { ProfessionalsPage } from '../pages/ProfessionalsPage'
import { ProfessionalEditorPage } from '../pages/ProfessionalEditorPage'
import { RegisterPage } from '../pages/RegisterPage'
import { ServicesPage } from '../pages/ServicesPage'
import { WeeklyAgendaPage } from '../pages/WeeklyAgendaPage'
import { ClientRoute } from './ClientRoute'
import { ProtectedRoute, type AdminSession } from './ProtectedRoute'

interface AppRoutesProps { session?: AdminSession | null }

function AdminRoute({ title, subtitle, children, session, backTo }: { title: string; subtitle: string; children: ReactNode; session?: AdminSession | null; backTo?: string }) {
  const location = useLocation()
  return <ProtectedRoute session={session}><AdminShell title={title} subtitle={subtitle} backTo={backTo ? `${backTo}${location.search}` : undefined} backLabel={backTo ? 'Voltar para profissionais' : undefined}>{children}</AdminShell></ProtectedRoute>
}

function ClientBookingRoute({ session }: { session?: AdminSession | null }) {
  const isClient = session?.role === 'CLIENTE'
  const page = <ClientBookingPage embedded={isClient} />
  if (!isClient) return page
  return <ClientShell title="Novo agendamento" subtitle="Escolha o serviço, o profissional e encontre um horário para você.">{page}</ClientShell>
}

export function AppRoutes({ session }: AppRoutesProps) {
  const dashboardDate = new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date())
  return <Routes>
    <Route path="/" element={<Navigate to="/login" replace />} />
    <Route path="/login" element={<LoginPage />} />
    <Route path="/cadastro" element={<RegisterPage />} />
    <Route path="/agendar/*" element={<ClientBookingRoute session={session} />} />
    <Route path="/meus-agendamentos" element={<ClientRoute session={session}><ClientShell title="Meus agendamentos" subtitle="Acompanhe seus horários e mantenha sua agenda em dia."><ClientAppointmentsPage /></ClientShell></ClientRoute>} />
    <Route path="/painel" element={<ProtectedRoute session={session}><AdminShell title="Visão geral" subtitle={`Hoje, ${dashboardDate} · Studio Boa Forma`} headerActions={<Link className="dashboard-new-action" to="/painel/agendamentos/novo"><Plus size={18} />Novo agendamento</Link>}><DashboardPage /></AdminShell></ProtectedRoute>} />
    <Route path="/painel/agenda" element={<ProtectedRoute session={session}><AdminShell title="Agenda" subtitle="Gerencie os atendimentos da sua equipe."><WeeklyAgendaPage /></AdminShell></ProtectedRoute>} />
    <Route path="/painel/profissionais" element={<AdminRoute session={session} title="Profissionais" subtitle="Gerencie os profissionais e os horários de atendimento."><ProfessionalsPage /></AdminRoute>} />
    <Route path="/painel/profissionais/novo" element={<AdminRoute session={session} title="Novo profissional" subtitle="Cadastre os dados e os horários de atendimento." backTo="/painel/profissionais"><ProfessionalEditorPage /></AdminRoute>} />
    <Route path="/painel/profissionais/:id/editar" element={<AdminRoute session={session} title="Editar profissional" subtitle="Atualize os dados e os horários de atendimento." backTo="/painel/profissionais"><ProfessionalEditorPage /></AdminRoute>} />
    <Route path="/painel/servicos" element={<AdminRoute session={session} title="Serviços" subtitle="Gerencie os preços, a duração e a disponibilidade dos serviços."><ServicesPage /></AdminRoute>} />
    <Route path="/painel/agendamentos/novo" element={<ProtectedRoute session={session}><Navigate to="/painel/agenda?novo=1" replace /></ProtectedRoute>} />
    <Route path="*" element={<Navigate to="/login" replace />} />
  </Routes>
}
