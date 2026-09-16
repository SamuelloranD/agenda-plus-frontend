import { describe, expect, it } from 'vitest'
import type { AgendamentoResponse, AgendamentoStatus } from '../../../types/scheduling'
import { deriveDashboardMetrics } from './dashboardMetrics'

function appointment(id: string, inicio: string, status: AgendamentoStatus): AgendamentoResponse {
  return {
    id,
    inicio,
    fim: inicio.replace(':00:00', ':45:00'),
    profissionalId: `professional-${id}`,
    clienteId: `client-${id}`,
    servicoId: `service-${id}`,
    status,
  }
}

describe('deriveDashboardMetrics', () => {
  it('keeps only appointments from the supplied calendar day in the today list', () => {
    const appointments = [
      appointment('previous', '2026-09-15T18:00:00', 'CONFIRMADO'),
      appointment('morning', '2026-09-16T09:00:00', 'PENDENTE'),
      appointment('afternoon', '2026-09-16T15:30:00', 'CONCLUIDO'),
      appointment('next', '2026-09-17T08:00:00', 'CANCELADO'),
    ]

    const metrics = deriveDashboardMetrics(appointments, new Date(2026, 8, 16, 12))

    expect(metrics.todayCount).toBe(2)
    expect(metrics.todayAppointments.map(({ id }) => id)).toEqual(['morning', 'afternoon'])
  })

  it('counts every scheduling status independently from its date', () => {
    const appointments = [
      appointment('pending-today', '2026-09-16T09:00:00', 'PENDENTE'),
      appointment('pending-next', '2026-09-17T09:00:00', 'PENDENTE'),
      appointment('confirmed', '2026-09-16T10:00:00', 'CONFIRMADO'),
      appointment('cancelled', '2026-09-16T11:00:00', 'CANCELADO'),
      appointment('completed', '2026-09-16T12:00:00', 'CONCLUIDO'),
    ]

    const metrics = deriveDashboardMetrics(appointments, new Date(2026, 8, 16, 12))

    expect(metrics.pendingCount).toBe(2)
    expect(metrics.confirmedCount).toBe(1)
    expect(metrics.cancelledCount).toBe(1)
  })
})
