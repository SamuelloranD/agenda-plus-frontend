import type { AgendamentoResponse } from '../../../types/scheduling'

export interface DashboardMetrics {
  todayCount: number
  pendingCount: number
  confirmedCount: number
  cancelledCount: number
  todayAppointments: AgendamentoResponse[]
}

function localDateKey(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function deriveDashboardMetrics(appointments: AgendamentoResponse[], today: Date): DashboardMetrics {
  const todayKey = localDateKey(today)
  const todayAppointments = appointments
    .filter(({ inicio }) => inicio.slice(0, 10) === todayKey)
    .toSorted((first, second) => first.inicio.localeCompare(second.inicio))

  return {
    todayCount: todayAppointments.length,
    pendingCount: appointments.filter(({ status }) => status === 'PENDENTE').length,
    confirmedCount: appointments.filter(({ status }) => status === 'CONFIRMADO').length,
    cancelledCount: appointments.filter(({ status }) => status === 'CANCELADO').length,
    todayAppointments,
  }
}

export function calculateExpectedBilling(appointments: AgendamentoResponse[], servicePrices: ReadonlyMap<string, number>) {
  return appointments
    .filter(({ status }) => status === 'PENDENTE' || status === 'CONFIRMADO' || status === 'CONCLUIDO')
    .reduce((total, appointment) => total + (servicePrices.get(appointment.servicoId) ?? 0), 0)
}
