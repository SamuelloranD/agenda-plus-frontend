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
    expect(screen.getAllByRole('gridcell')).toHaveLength(49)
  })

  it('notifies which date and time were selected from an empty cell', () => {
    const onReserve = vi.fn()

    render(<WeeklyCalendar weekStart={new Date(2026, 8, 14, 12)} appointments={[]} directory={createAppointmentDirectory({ clients: [], professionals: [], services: [] })} onReserve={onReserve} />)

    fireEvent.click(screen.getAllByRole('button', { name: '+ Reservar' })[0])

    expect(onReserve).toHaveBeenCalledWith({ date: '2026-09-14', start: '08:00' })
  })
})
