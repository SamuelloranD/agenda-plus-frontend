import { resolveAppointmentLabels, type AppointmentDirectory } from '../utils/appointmentDirectory'
import type { AgendamentoResponse } from '../../../types/scheduling'
import type { CSSProperties } from 'react'

interface AppointmentCardProps {
  appointment: AgendamentoResponse
  directory: AppointmentDirectory
  style?: CSSProperties
}

export function AppointmentCard({ appointment, directory, style }: AppointmentCardProps) {
  const labels = resolveAppointmentLabels(appointment, directory)
  const statusClass = {
    CONFIRMADO: 'confirmed',
    PENDENTE: 'pending',
    CANCELADO: 'cancelled',
    CONCLUIDO: 'completed',
  }[appointment.status] ?? 'pending'

  return (
    <article className={`appointment-card appointment-card--${statusClass}`} style={style}>
      <time dateTime={appointment.inicio}>{appointment.inicio.slice(11, 16)} — {appointment.fim.slice(11, 16)}</time>
      <strong>Cliente {labels.clientName}</strong>
      <span>Serviço {labels.serviceName}</span>
      <small>Profissional {labels.professionalName}</small>
    </article>
  )
}
