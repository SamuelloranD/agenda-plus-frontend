import { useState } from 'react'
import { ArrowRight, Check, Clock3, Info, UserRound } from 'lucide-react'
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
  const [expanded, setExpanded] = useState(false)
  const detailsId = `appointment-details-${appointment.id}`
  const message = appointment.status === 'CONFIRMADO'
    ? 'Seu horário está confirmado.'
    : 'Aguardando confirmação do estabelecimento.'

  return (
    <article className={`client-appointment-card client-appointment-card--${appointment.status.toLowerCase()}`}>
      <div className="client-appointment-card__main">
        <div className="client-appointment-card__heading">
          <div>
            <p className="client-appointment-card__date">{formatAppointmentDate(appointment.inicio)}</p>
            <h3>{names.serviceName}</h3>
          </div>
          <div className="client-appointment-card__status"><StatusBadge status={appointment.status} /><span>{formatServicePrice(price)}</span></div>
        </div>
        <dl className="client-appointment-card__details">
          <div>
            <UserRound size={22} aria-hidden="true" />
            <span><dt>Profissional</dt><dd>{names.professionalName}</dd></span>
          </div>
          <div>
            <Clock3 size={22} aria-hidden="true" />
            <span><dt>Horário</dt><dd>{formatAppointmentTimeRange(appointment.inicio, appointment.fim)}</dd></span>
          </div>
        </dl>
      </div>
      <div className="client-appointment-card__footer">
        <p>{appointment.status === 'CONFIRMADO' ? <Check size={16} aria-hidden="true" /> : <Info size={16} aria-hidden="true" />}{message}</p>
        <button type="button" aria-expanded={expanded} aria-controls={detailsId} onClick={() => setExpanded((value) => !value)}>
          {expanded ? 'Ocultar detalhes' : 'Ver detalhes'} <ArrowRight size={17} aria-hidden="true" />
        </button>
      </div>
      {expanded && (
        <div className="client-appointment-card__expanded" id={detailsId}>
          <span><strong>Data:</strong> {formatAppointmentDate(appointment.inicio)}</span>
          <span><strong>Protocolo:</strong> {appointment.id}</span>
        </div>
      )}
    </article>
  )
}
