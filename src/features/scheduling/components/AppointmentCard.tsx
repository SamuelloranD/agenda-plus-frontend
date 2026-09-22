import { StatusBadge } from '../../../components/ui/StatusBadge'
import { resolveAppointmentLabels, type AppointmentDirectory } from '../utils/appointmentDirectory'
import type { AgendamentoResponse } from '../../../types/scheduling'
import { getProfessionalTone } from '../utils/professionalTone'
import { AppointmentActions } from './AppointmentActions'

interface AppointmentCardProps {
  appointment: AgendamentoResponse
  directory: AppointmentDirectory
}

export function AppointmentCard({ appointment, directory }: AppointmentCardProps) {
  const labels = resolveAppointmentLabels(appointment, directory)

  return (
    <article className={`appointment-card appointment-card--${getProfessionalTone(appointment.profissionalId)}`}>
      <time dateTime={appointment.inicio}>{appointment.inicio.slice(11, 16)} — {appointment.fim.slice(11, 16)}</time>
      <strong>Cliente {labels.clientName}</strong>
      <span>Serviço {labels.serviceName}</span>
      <small>Profissional {labels.professionalName}</small>
      <StatusBadge status={appointment.status} />
      <AppointmentActions appointment={appointment} />
    </article>
  )
}
