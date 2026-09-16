import { StatusBadge } from '../../../components/ui/StatusBadge'
import type { AgendamentoResponse } from '../../../types/scheduling'
import { getProfessionalTone } from '../utils/professionalTone'

function shortId(value: string) {
  return value.slice(0, 8)
}

export function AppointmentCard({ appointment }: { appointment: AgendamentoResponse }) {
  return (
    <article className={`appointment-card appointment-card--${getProfessionalTone(appointment.profissionalId)}`}>
      <time dateTime={appointment.inicio}>{appointment.inicio.slice(11, 16)} — {appointment.fim.slice(11, 16)}</time>
      <strong>Cliente {shortId(appointment.clienteId)}</strong>
      <span>Serviço {shortId(appointment.servicoId)}</span>
      <small>Profissional {shortId(appointment.profissionalId)}</small>
      <StatusBadge status={appointment.status} />
    </article>
  )
}
