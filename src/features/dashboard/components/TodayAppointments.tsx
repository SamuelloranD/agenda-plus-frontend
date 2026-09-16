import { EmptyState } from '../../../components/ui/EmptyState'
import { StatusBadge } from '../../../components/ui/StatusBadge'
import type { AgendamentoResponse } from '../../../types/scheduling'

function shortId(value: string) {
  return value.slice(0, 8)
}

export function TodayAppointments({ appointments }: { appointments: AgendamentoResponse[] }) {
  if (appointments.length === 0) return <EmptyState message="Nenhum atendimento reservado para hoje." />

  return (
    <ol className="today-list">
      {appointments.map((appointment) => (
        <li key={appointment.id} className={`today-item today-item--${appointment.status.toLowerCase()}`}>
          <time dateTime={appointment.inicio}>{appointment.inicio.slice(11, 16)}</time>
          <div>
            <strong>Cliente {shortId(appointment.clienteId)}</strong>
            <span>Serviço {shortId(appointment.servicoId)} · Profissional {shortId(appointment.profissionalId)}</span>
          </div>
          <StatusBadge status={appointment.status} />
        </li>
      ))}
    </ol>
  )
}
