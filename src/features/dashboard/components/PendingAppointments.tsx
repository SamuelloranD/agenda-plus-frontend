import { CalendarDays, Clock3 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useConfirmAgendamento } from '../../scheduling/hooks/useConfirmAgendamento'
import { resolveAppointmentLabels, type AppointmentDirectory } from '../../scheduling/utils/appointmentDirectory'
import type { AgendamentoResponse } from '../../../types/scheduling'
import { formatServicePrice } from '../../client-appointments/utils/appointmentPresentation'

export function PendingAppointments({ appointments, directory }: { appointments: AgendamentoResponse[]; directory: AppointmentDirectory }) {
  if (appointments.length === 0) return <p className="dashboard-empty">Nenhuma solicitação pendente.</p>
  return <div className="pending-list">{appointments.slice(0, 3).map((appointment) => <PendingAppointment key={appointment.id} appointment={appointment} directory={directory} />)}</div>
}

function PendingAppointment({ appointment, directory }: { appointment: AgendamentoResponse; directory: AppointmentDirectory }) {
  const confirm = useConfirmAgendamento()
  const labels = resolveAppointmentLabels(appointment, directory)
  const date = new Date(appointment.inicio)
  return <article className="pending-card">
    <div className="pending-card__date"><strong>{date.getDate()}</strong><span>{new Intl.DateTimeFormat('pt-BR', { month: 'short' }).format(date).replace('.', '').toUpperCase()}</span></div>
    <div className="pending-card__main"><time>{appointment.inicio.slice(11, 16)} – {appointment.fim.slice(11, 16)}</time><strong>Cliente {labels.clientName}</strong><span>{labels.serviceName} · {Math.round((Date.parse(appointment.fim) - Date.parse(appointment.inicio)) / 60000)} minutos</span><span>Profissional: {labels.professionalName}</span><b>{formatServicePrice(directory.servicePrices.get(appointment.servicoId))}</b></div>
    <div className="pending-card__actions"><button type="button" className="appointment-action appointment-action--confirm" onClick={() => confirm.mutate(appointment.id)} disabled={confirm.isPending}>{confirm.isPending ? 'Confirmando…' : 'Confirmar'}</button><Link to={`/painel/agenda?agendamento=${appointment.id}`} className="appointment-action appointment-action--details"><CalendarDays size={15} aria-hidden="true" />Ver detalhes</Link></div>
    <span className="pending-card__clock" aria-hidden="true"><Clock3 size={18} /></span>
  </article>
}
