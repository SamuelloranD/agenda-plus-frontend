import type { ProfissionalResponse } from '../../../types/professionals'
import type { AgendamentoResponse } from '../../../types/scheduling'
import type { ServicoResponse } from '../../../types/services'

const CANCELLATION_WINDOW_MS = 24 * 60 * 60 * 1000
const cancellableStatuses = new Set(['PENDENTE', 'CONFIRMADO'])

export interface AppointmentNameMaps {
  professionals: ReadonlyMap<string, string>
  services: ReadonlyMap<string, string>
}

export interface ClientAppointmentNames {
  professionalName: string
  serviceName: string
}

export function buildAppointmentNameMaps(
  professionals: ProfissionalResponse[],
  services: ServicoResponse[],
): AppointmentNameMaps {
  return {
    professionals: new Map(professionals.map(({ id, nome }) => [id, nome])),
    services: new Map(services.map(({ id, nome }) => [id, nome])),
  }
}

export function resolveClientAppointmentNames(
  appointment: Pick<AgendamentoResponse, 'profissionalId' | 'servicoId'>,
  names: AppointmentNameMaps,
): ClientAppointmentNames {
  return {
    professionalName: names.professionals.get(appointment.profissionalId) ?? 'Profissional não identificado',
    serviceName: names.services.get(appointment.servicoId) ?? 'Serviço não identificado',
  }
}

export function canCancelAppointment(appointment: AgendamentoResponse, now = new Date()) {
  const startsAt = new Date(appointment.inicio).getTime()
  return cancellableStatuses.has(appointment.status) && startsAt - now.getTime() >= CANCELLATION_WINDOW_MS
}

export function formatAppointmentDate(value: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date(value))
}

export function formatAppointmentTimeRange(start: string, end: string) {
  const formatter = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit', hour12: false })
  return `${formatter.format(new Date(start))} — ${formatter.format(new Date(end))}`
}

export function splitClientAppointments(appointments: AgendamentoResponse[], now = new Date()) {
  const upcoming: AgendamentoResponse[] = []
  const history: AgendamentoResponse[] = []

  appointments.forEach((appointment) => {
    const isFutureActive = new Date(appointment.inicio).getTime() >= now.getTime()
      && cancellableStatuses.has(appointment.status)
    ;(isFutureActive ? upcoming : history).push(appointment)
  })

  upcoming.sort((left, right) => new Date(left.inicio).getTime() - new Date(right.inicio).getTime())
  history.sort((left, right) => new Date(right.inicio).getTime() - new Date(left.inicio).getTime())

  return { upcoming, history }
}
