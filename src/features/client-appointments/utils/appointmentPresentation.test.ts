import { describe, expect, it } from 'vitest'
import type { AgendamentoResponse } from '../../../types/scheduling'
import {
  buildAppointmentNameMaps,
  canCancelAppointment,
  formatAppointmentDate,
  formatAppointmentTimeRange,
  resolveClientAppointmentNames,
  splitClientAppointments,
} from './appointmentPresentation'

const appointment: AgendamentoResponse = {
  id: 'appointment-1',
  inicio: '2026-09-20T14:00:00',
  fim: '2026-09-20T14:45:00',
  profissionalId: 'professional-1',
  clienteId: 'client-1',
  servicoId: 'service-1',
  status: 'CONFIRMADO',
}

describe('appointment presentation', () => {
  it('resolves service and professional IDs to catalog names', () => {
    const names = buildAppointmentNameMaps(
      [{ id: 'professional-1', nome: 'João Silva', especialidade: 'Cabeleireiro', horariosTrabalho: [] }],
      [{ id: 'service-1', nome: 'Corte de Cabelo', duracaoMinutos: 45, preco: { valor: 80, moeda: 'BRL' } }],
    )

    expect(resolveClientAppointmentNames(appointment, names)).toEqual({
      professionalName: 'João Silva',
      serviceName: 'Corte de Cabelo',
    })
  })

  it('uses neutral labels instead of exposing missing IDs', () => {
    const labels = resolveClientAppointmentNames(appointment, {
      professionals: new Map(),
      services: new Map(),
    })

    expect(labels).toEqual({
      professionalName: 'Profissional não identificado',
      serviceName: 'Serviço não identificado',
    })
    expect(JSON.stringify(labels)).not.toContain('professional-1')
    expect(JSON.stringify(labels)).not.toContain('service-1')
  })

  it.each(['PENDENTE', 'CONFIRMADO'] as const)('allows cancellation for a %s appointment at least 24 hours away', (status) => {
    expect(canCancelAppointment({ ...appointment, status }, new Date('2026-09-19T13:59:00'))).toBe(true)
  })

  it.each([
    ['CANCELADO', '2026-09-19T10:00:00'],
    ['CONCLUIDO', '2026-09-19T10:00:00'],
    ['CONFIRMADO', '2026-09-20T14:01:00'],
    ['PENDENTE', '2026-09-19T15:00:00'],
  ] as const)('does not allow cancellation for status %s at reference time %s', (status, now) => {
    expect(canCancelAppointment({ ...appointment, status }, new Date(now))).toBe(false)
  })

  it('formats date and time in pt-BR without exposing the raw timestamp', () => {
    expect(formatAppointmentDate(appointment.inicio)).toMatch(/domingo, 20 de setembro de 2026/i)
    expect(formatAppointmentTimeRange(appointment.inicio, appointment.fim)).toBe('14:00 — 14:45')
  })

  it('separates active future appointments from history and sorts both groups', () => {
    const upcomingLater = { ...appointment, id: 'later', inicio: '2026-09-22T10:00:00' }
    const upcomingSooner = { ...appointment, id: 'sooner', inicio: '2026-09-21T10:00:00' }
    const canceledFuture = { ...appointment, id: 'canceled', inicio: '2026-09-23T10:00:00', status: 'CANCELADO' as const }
    const past = { ...appointment, id: 'past', inicio: '2026-09-18T10:00:00', status: 'CONCLUIDO' as const }

    const result = splitClientAppointments(
      [upcomingLater, past, canceledFuture, upcomingSooner],
      new Date('2026-09-20T10:00:00'),
    )

    expect(result.upcoming.map(({ id }) => id)).toEqual(['sooner', 'later'])
    expect(result.history.map(({ id }) => id)).toEqual(['canceled', 'past'])
  })
})
