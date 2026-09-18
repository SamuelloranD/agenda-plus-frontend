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

function appointmentDate(value: string) {
  // The API emits LocalDateTime without an offset and compares it with Clock.systemUTC().
  return new Date(/(?:Z|[+-]\d{2}:\d{2})$/i.test(value) ? value : `${value}Z`)
}

export function canCancelAppointment(appointment: AgendamentoResponse, now = new Date()) {
  const startsAt = appointmentDate(appointment.inicio).getTime()
  return cancellableStatuses.has(appointment.status) && startsAt - now.getTime() >= CANCELLATION_WINDOW_MS
}

export function formatAppointmentDate(value: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(appointmentDate(value))
}

export function formatAppointmentTimeRange(start: string, end: string) {
  // Keep the API's appointment wall-clock values, independent of the browser's timezone/DST.
  const formatter = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'UTC' })
  return `${formatter.format(appointmentDate(start))} — ${formatter.format(appointmentDate(end))}`
}

export function splitClientAppointments(appointments: AgendamentoResponse[], now = new Date()) {
  const upcoming: AgendamentoResponse[] = []
  const history: AgendamentoResponse[] = []

  appointments.forEach((appointment) => {
    const isFutureActive = appointmentDate(appointment.inicio).getTime() >= now.getTime()
      && cancellableStatuses.has(appointment.status)
    ;(isFutureActive ? upcoming : history).push(appointment)
  })

  upcoming.sort((left, right) => appointmentDate(left.inicio).getTime() - appointmentDate(right.inicio).getTime())
  history.sort((left, right) => appointmentDate(right.inicio).getTime() - appointmentDate(left.inicio).getTime())

  return { upcoming, history }
}
