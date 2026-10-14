import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { DashboardAppointmentTable } from './DashboardAppointmentTable'
import { createAppointmentDirectory } from '../../scheduling/utils/appointmentDirectory'

const directory = createAppointmentDirectory({ clients: [], professionals: [], services: [] })

describe('DashboardAppointmentTable', () => {
  it('uses friendly status labels and compact action columns', () => {
    render(<MemoryRouter><DashboardAppointmentTable appointments={[{ id: 'a1', inicio: '2026-10-14T08:00:00', fim: '2026-10-14T08:30:00', clienteId: 'c1', profissionalId: 'p1', servicoId: 's1', status: 'PENDENTE' }]} directory={directory} /></MemoryRouter>)

    expect(screen.getByText('Pendente')).toBeInTheDocument()
    expect(screen.queryByText('PENDENTE')).not.toBeInTheDocument()
    expect(screen.getByRole('table')).toHaveClass('dashboard-table')
  })
})
