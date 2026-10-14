import { CalendarDays, MoreVertical, UserRound } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { StatusBadge } from '../../../components/ui/StatusBadge'
import { resolveAppointmentLabels, type AppointmentDirectory } from '../../scheduling/utils/appointmentDirectory'
import type { AgendamentoResponse } from '../../../types/scheduling'

const dashboardStatusLabels = { PENDENTE: 'Pendente', CONFIRMADO: 'Confirmado', CANCELADO: 'Cancelado', CONCLUIDO: 'Concluído' } as const

interface DashboardAppointmentTableProps {
  appointments: AgendamentoResponse[]
  directory: AppointmentDirectory
  showDate?: boolean
}

function dateLabel(value: string) {
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', weekday: 'short' }).format(new Date(value))
    .replace('.', '')
}

export function DashboardAppointmentTable({ appointments, directory, showDate = false }: DashboardAppointmentTableProps) {
  if (appointments.length === 0) return <p className="dashboard-empty">Nenhum atendimento reservado neste período.</p>

  return <div className="dashboard-table-wrap"><table className={`dashboard-table${showDate ? ' dashboard-table--with-date' : ''}`}><thead><tr>{showDate && <th>Data</th>}<th>Horário</th><th>Cliente</th><th>Serviço</th><th>Profissional</th><th>Situação</th><th>Ações</th></tr></thead><tbody>{appointments.map((appointment) => {
    const labels = resolveAppointmentLabels(appointment, directory)
    return <tr key={appointment.id}>
      {showDate && <td>{dateLabel(appointment.inicio)}</td>}
      <td className="dashboard-table__time">{appointment.inicio.slice(11, 16)} – {appointment.fim.slice(11, 16)}</td>
      <td><strong>{labels.clientName}</strong></td>
      <td><strong>{labels.serviceName}</strong><small>{directory.servicePrices.has(appointment.servicoId) ? 'Atendimento' : 'Serviço'}</small></td>
      <td><span className="dashboard-table__person"><UserRound size={18} aria-hidden="true" />{labels.professionalName}</span></td>
      <td><StatusBadge status={appointment.status} label={dashboardStatusLabels[appointment.status]} /></td>
      <td><span className="dashboard-table__actions"><Link to={`/painel/agenda?agendamento=${appointment.id}`}>Ver detalhes</Link><button type="button" aria-label={`Mais ações para ${labels.clientName}`}><MoreVertical size={17} aria-hidden="true" /></button></span></td>
    </tr>
  })}</tbody></table></div>
}

export function DashboardSectionIcon({ children }: { children: ReactNode }) {
  return <span className="dashboard-section-icon" aria-hidden="true"><CalendarDays size={22} strokeWidth={1.8} />{children}</span>
}
