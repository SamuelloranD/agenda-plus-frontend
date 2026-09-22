import { EmptyState } from '../../../components/ui/EmptyState'
import { StatusBadge } from '../../../components/ui/StatusBadge'
import { resolveAppointmentLabels, type AppointmentDirectory } from '../../../features/scheduling/utils/appointmentDirectory'
import type { AgendamentoResponse } from '../../../types/scheduling'
import { AppointmentActions } from '../../scheduling/components/AppointmentActions'

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
            <StatusBadge status={appointment.status} />
            <AppointmentActions appointment={appointment} />
          </li>
        )
      })}
    </ol>
  )
}
