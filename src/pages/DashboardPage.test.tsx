import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DashboardPage } from './DashboardPage'

const hooks = vi.hoisted(() => ({
  appointments: vi.fn(),
  directory: vi.fn(),
}))

vi.mock('../features/scheduling/hooks/useAgendamentos', () => ({ useAgendamentos: hooks.appointments }))
vi.mock('../features/scheduling/hooks/useAppointmentDirectory', () => ({ useAppointmentDirectory: hooks.directory }))
vi.mock('../features/dashboard/components/TodayAppointments', () => ({
  TodayAppointments: ({ appointments, emptyMessage }: { appointments: unknown[]; emptyMessage?: string }) => (
    <div data-testid="dashboard-appointments">{appointments.length}:{emptyMessage ?? 'hoje'}</div>
  ),
}))

const loadedQuery = (conteudo: unknown[]) => ({
  data: { conteudo, totalPaginas: 1 },
  isLoading: false,
  isError: false,
  refetch: vi.fn(),
})

beforeEach(() => {
  vi.clearAllMocks()
  hooks.appointments.mockReturnValueOnce(loadedQuery([])).mockReturnValueOnce(loadedQuery([]))
  hooks.directory.mockReturnValue({
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
    directory: { clients: [], professionals: [], services: [], servicePrices: new Map() },
  })
})

afterEach(cleanup)

describe('DashboardPage', () => {
  it('loads today and future appointments into separate cards', () => {
    render(<DashboardPage />)

    expect(screen.getByRole('heading', { name: 'Atendimentos de hoje' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Atendimentos futuros' })).toBeInTheDocument()
    expect(hooks.appointments).toHaveBeenCalledTimes(2)
    expect(hooks.appointments.mock.calls[1][0]).toEqual(expect.objectContaining({ dataInicio: expect.any(String) }))
    expect(hooks.appointments.mock.calls[1][0].dataFim).toBeUndefined()
    expect(screen.getAllByTestId('dashboard-appointments')[1]).toHaveTextContent('0:Nenhum atendimento futuro reservado.')
  })
})
