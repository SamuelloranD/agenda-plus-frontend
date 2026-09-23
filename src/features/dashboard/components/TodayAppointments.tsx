import { EmptyState } from '../../../components/ui/EmptyState'
import { StatusBadge } from '../../../components/ui/StatusBadge'
import { resolveAppointmentLabels, type AppointmentDirectory } from '../../../features/scheduling/utils/appointmentDirectory'
import type { AgendamentoResponse } from '../../../types/scheduling'
import { AppointmentActions } from '../../scheduling/components/AppointmentActions'
import { formatServicePrice } from '../../client-appointments/utils/appointmentPresentation'

interface TodayAppointmentsProps {
  appointments: AgendamentoResponse[]
  directory: AppointmentDirectory
}

export function TodayAppointments({ appointments, directory }: TodayAppointmentsProps) {
  if (appointments.length === 0) return <EmptyState message="Nenhum atendimento reservado para hoje." />

  return (
    <ol className="today-list">
      {appointments.map((appointment) => {
        const labels = resolveAppointmentLabels(appointment, directory)
        return (
          <li key={appointment.id} className={`today-item today-item--${appointment.status.toLowerCase()}`}>
            <time dateTime={appointment.inicio}>{appointment.inicio.slice(11, 16)}</time>
            <div>
              <strong>Cliente {labels.clientName}</strong>
              <span>Serviço {labels.serviceName} · Profissional {labels.professionalName}</span>
            </div>
            <div className="today-item__footer">
              <div className="appointment-status-row">
                <StatusBadge status={appointment.status} />
                <span className="today-item__price">{formatServicePrice(directory.servicePrices.get(appointment.servicoId))}</span>
              </div>
              <AppointmentActions appointment={appointment} serviceName={labels.serviceName} professionalName={labels.professionalName} />
            </div>
          </li>
        )
      })}
    </ol>
  )
}
