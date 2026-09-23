import { describe, expect, it } from 'vitest'
import type { AgendamentoResponse } from '../../../types/scheduling'
import {
  buildAppointmentNameMaps,
  canCancelAppointment,
  formatAppointmentDate,
  formatAppointmentTimeRange,
  isWithinCancellationWindow,
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
  it('detects when an active appointment is inside the 24-hour window', () => {
    expect(isWithinCancellationWindow(appointment, new Date('2026-09-20T10:00:00Z'))).toBe(true)
    expect(isWithinCancellationWindow(appointment, new Date('2026-09-19T13:59:59.999Z'))).toBe(false)
  })

  it.each([
    ['2026-09-19T13:59:59.999Z', true],
    ['2026-09-19T14:00:00.000Z', true],
    ['2026-09-19T14:00:00.001Z', false],
    ['2026-09-19T11:00:00.000-03:00', true],
    ['2026-09-19T11:00:00.001-03:00', false],
  ])('uses the backend UTC clock for cancellation at %s', (now, expected) => {
    expect(canCancelAppointment(appointment, new Date(now))).toBe(expected)
  })

  it('moves a no-offset active appointment into history immediately after its UTC start', () => {
    expect(splitClientAppointments([appointment], new Date('2026-09-20T14:00:00Z')).upcoming).toEqual([appointment])
    expect(splitClientAppointments([appointment], new Date('2026-09-20T14:00:00.001Z')).history).toEqual([appointment])
  })

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
    expect(canCancelAppointment({ ...appointment, status }, new Date('2026-09-19T13:59:00Z'))).toBe(true)
  })

  it.each([
    ['CANCELADO', '2026-09-19T10:00:00Z'],
    ['CONCLUIDO', '2026-09-19T10:00:00Z'],
    ['CONFIRMADO', '2026-09-20T14:01:00Z'],
    ['PENDENTE', '2026-09-19T15:00:00Z'],
  ] as const)('does not allow cancellation for status %s at reference time %s', (status, now) => {
    expect(canCancelAppointment({ ...appointment, status }, new Date(now))).toBe(false)
  })

  it('formats date and time in pt-BR without exposing the raw timestamp', () => {
    expect(formatAppointmentDate(appointment.inicio)).toMatch(/domingo, 20 de setembro de 2026/i)
    expect(formatAppointmentTimeRange(appointment.inicio, appointment.fim)).toBe('14:00 — 14:45')
  })

  it('preserves wall-clock dates near midnight and times in a browser DST gap', () => {
    expect(formatAppointmentDate('2026-09-20T00:15:00')).toMatch(/domingo, 20 de setembro de 2026/i)
    expect(formatAppointmentTimeRange('2026-09-20T00:15:00', '2026-09-20T00:45:00')).toBe('00:15 — 00:45')
    expect(formatAppointmentTimeRange('2026-03-08T02:15:00', '2026-03-08T02:45:00')).toBe('02:15 — 02:45')
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
