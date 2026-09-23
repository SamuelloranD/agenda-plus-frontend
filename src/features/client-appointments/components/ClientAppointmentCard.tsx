import { StatusBadge } from '../../../components/ui/StatusBadge'
import type { AgendamentoResponse } from '../../../types/scheduling'
import {
  canCancelAppointment,
  formatAppointmentDate,
  formatAppointmentTimeRange,
  formatServicePrice,
  type ClientAppointmentNames,
} from '../utils/appointmentPresentation'

interface ClientAppointmentCardProps {
  appointment: AgendamentoResponse
  names: ClientAppointmentNames
  now?: Date
  onCancel: () => void
  price?: number
}

export function ClientAppointmentCard({ appointment, names, now, onCancel, price }: ClientAppointmentCardProps) {
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
      {canCancelAppointment(appointment, now) && (
        <button className="client-appointment-card__cancel" type="button" onClick={onCancel}>Cancelar</button>
      )}
    </article>
  )
}
