import { Clock3, Scissors, UserRound } from 'lucide-react'
import { StatusBadge } from '../../../components/ui/StatusBadge'
import type { AgendamentoResponse } from '../../../types/scheduling'
import {
  formatAppointmentDate,
  formatAppointmentTimeRange,
  formatServicePrice,
  type ClientAppointmentNames,
} from '../utils/appointmentPresentation'

interface ClientAppointmentHistoryRowProps {
  appointment: AgendamentoResponse
  names: ClientAppointmentNames
  price?: number
}

export function ClientAppointmentHistoryRow({ appointment, names, price }: ClientAppointmentHistoryRowProps) {
  return (
    <article className="client-history-row">
      <div className="client-history-row__date">
        <span className="client-history-row__icon"><Scissors size={19} aria-hidden="true" /></span>
        <time dateTime={appointment.inicio}>{formatAppointmentDate(appointment.inicio)}</time>
      </div>
      <h3>{names.serviceName}</h3>
      <div className="client-history-row__professional">
        <UserRound size={20} aria-hidden="true" />
        <span><small>Profissional</small><strong>{names.professionalName}</strong></span>
      </div>
      <div className="client-history-row__time">
        <Clock3 size={20} aria-hidden="true" />
        <span>{formatAppointmentTimeRange(appointment.inicio, appointment.fim)}</span>
      </div>
      <strong className="client-history-row__price">{formatServicePrice(price)}</strong>
      <div className="client-history-row__status"><StatusBadge status={appointment.status} /></div>
    </article>
  )
}
