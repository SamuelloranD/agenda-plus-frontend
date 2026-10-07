import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { WeeklyCalendar } from './WeeklyCalendar'
import { createAppointmentDirectory } from '../utils/appointmentDirectory'

afterEach(cleanup)

describe('WeeklyCalendar accessibility', () => {
  it('exposes a grid and labels each reservation cell with its day and time', () => {
    render(<WeeklyCalendar weekStart={new Date(2026, 8, 14, 12)} appointments={[]} directory={createAppointmentDirectory({ clients: [], professionals: [], services: [] })} onReserve={vi.fn()} />)

    expect(screen.getByRole('grid', { name: 'Agenda semanal' })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: /segunda-feira, 14 de setembro/ })).toBeInTheDocument()
    expect(screen.getByRole('gridcell', { name: /segunda-feira, 14 de setembro.*08:00.*reservar/i })).toBeInTheDocument()
    expect(screen.getByRole('rowheader', { name: 'Horário 08:30' })).toBeInTheDocument()
    expect(screen.getByRole('rowheader', { name: 'Horário 09:00' })).toBeInTheDocument()
    expect(screen.getAllByRole('rowheader')).toHaveLength(25)
    expect(screen.getAllByRole('gridcell')).toHaveLength(175)
  })

  it('notifies which date and time were selected from an empty cell', () => {
    const onReserve = vi.fn()

    render(<WeeklyCalendar weekStart={new Date(2026, 8, 14, 12)} appointments={[]} directory={createAppointmentDirectory({ clients: [], professionals: [], services: [] })} onReserve={onReserve} />)

    fireEvent.click(screen.getAllByRole('button', { name: '+ Reservar' })[0])

    expect(onReserve).toHaveBeenCalledWith({ date: '2026-09-14', start: '08:00' })
  })

  it('sizes an appointment card according to its duration instead of a fixed row', () => {
    render(<WeeklyCalendar
      weekStart={new Date(2026, 8, 14, 12)}
      appointments={[{
        id: 'appointment-1',
        inicio: '2026-09-14T08:00:00',
        fim: '2026-09-14T08:45:00',
        profissionalId: 'professional-1',
        clienteId: 'client-1',
        servicoId: 'service-1',
        status: 'CONFIRMADO',
      }]}
      directory={createAppointmentDirectory({
        clients: [{ id: 'client-1', nome: 'Samuel', email: 'samuel@example.com', role: 'CLIENTE' }],
        professionals: [{ id: 'professional-1', nome: 'Thiago', especialidade: 'Barbeiro', horariosTrabalho: [] }],
        services: [{ id: 'service-1', nome: 'Barba', duracaoMinutos: 45, preco: { valor: 60, moeda: 'BRL' } }],
      })}
      onReserve={vi.fn()}
    />)

    expect(screen.getByRole('article')).toHaveStyle({ height: '144px' })
  })

  it('keeps a 15-minute appointment in the remaining part of a half-hour slot', () => {
    const appointment = (id: string, inicio: string, fim: string) => ({
      id,
      inicio,
      fim,
      profissionalId: 'professional-1',
      clienteId: 'client-1',
      servicoId: 'service-1',
      status: 'CONFIRMADO' as const,
    })

    render(<WeeklyCalendar
      weekStart={new Date(2026, 8, 14, 12)}
      appointments={[
        appointment('appointment-1', '2026-09-14T08:00:00', '2026-09-14T08:45:00'),
        appointment('appointment-2', '2026-09-14T08:45:00', '2026-09-14T09:00:00'),
      ]}
      directory={createAppointmentDirectory({ clients: [], professionals: [], services: [] })}
      onReserve={vi.fn()}
    />)

    expect(screen.getAllByRole('article')).toHaveLength(2)
    expect(screen.getAllByRole('article')[1]).toHaveStyle({ top: '48px', height: '48px' })
  })
})
