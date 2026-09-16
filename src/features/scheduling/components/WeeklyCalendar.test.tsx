import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { WeeklyCalendar } from './WeeklyCalendar'
import { createAppointmentDirectory } from '../utils/appointmentDirectory'

afterEach(cleanup)

describe('WeeklyCalendar accessibility', () => {
  it('exposes a grid and labels each reservation cell with its day and time', () => {
    render(<WeeklyCalendar weekStart={new Date(2026, 8, 14, 12)} appointments={[]} directory={createAppointmentDirectory({ clients: [], professionals: [], services: [] })} />)

    expect(screen.getByRole('grid', { name: 'Agenda semanal' })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: /segunda-feira, 14 de setembro/ })).toBeInTheDocument()
    expect(screen.getByRole('gridcell', { name: /segunda-feira, 14 de setembro.*08:00.*reservar/i })).toBeInTheDocument()
    expect(screen.getAllByRole('gridcell')).toHaveLength(49)
  })
})
