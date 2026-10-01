import { StatusBadge } from '../../../components/ui/StatusBadge'
import type { AgendamentoResponse } from '../../../types/scheduling'
import {
  formatAppointmentDate,
  formatAppointmentTimeRange,
  formatServicePrice,
  type ClientAppointmentNames,
} from '../utils/appointmentPresentation'

interface ClientAppointmentCardProps {
  appointment: AgendamentoResponse
  names: ClientAppointmentNames
  price?: number
}

export function ClientAppointmentCard({ appointment, names, price }: ClientAppointmentCardProps) {
  return (
    <article className="client-appointment-card">
      <div className="client-appointment-card__main">
        <div className="client-appointment-card__heading">
          <div>
            <p className="client-appointment-card__date">{formatAppointmentDate(appointment.inicio)}</p>
            <h3>{names.serviceName}</h3>
          </div>
          <div className="client-appointment-card__status"><StatusBadge status={appointment.status} /><span>{formatServicePrice(price)}</span></div>
        </div>
        <dl className="client-appointment-card__details">
          <div><dt>Profissional</dt><dd>{names.professionalName}</dd></div>
          <div><dt>Horário</dt><dd>{formatAppointmentTimeRange(appointment.inicio, appointment.fim)}</dd></div>
        </dl>
      </div>
    </article>
  )
}
