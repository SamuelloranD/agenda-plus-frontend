import { resolveAppointmentLabels, type AppointmentDirectory } from '../utils/appointmentDirectory'
import type { AgendamentoResponse } from '../../../types/scheduling'

interface AppointmentCardProps {
  appointment: AgendamentoResponse
  directory: AppointmentDirectory
}

export function AppointmentCard({ appointment, directory }: AppointmentCardProps) {
  const labels = resolveAppointmentLabels(appointment, directory)
  const statusClass = {
    CONFIRMADO: 'confirmed',
    PENDENTE: 'pending',
    CANCELADO: 'cancelled',
    CONCLUIDO: 'completed',
  }[appointment.status] ?? 'pending'

  return (
    <article className={`appointment-card appointment-card--${statusClass}`}>
      <time dateTime={appointment.inicio}>{appointment.inicio.slice(11, 16)} — {appointment.fim.slice(11, 16)}</time>
      <strong>Cliente {labels.clientName}</strong>
      <span>Serviço {labels.serviceName}</span>
      <small>Profissional {labels.professionalName}</small>
    </article>
  )
}
