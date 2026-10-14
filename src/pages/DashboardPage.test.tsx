import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DashboardPage } from './DashboardPage'

const hooks = vi.hoisted(() => ({
  appointments: vi.fn(),
  directory: vi.fn(),
}))

vi.mock('../features/scheduling/hooks/useAgendamentos', () => ({ useAgendamentos: hooks.appointments }))
vi.mock('../features/scheduling/hooks/useAppointmentDirectory', () => ({ useAppointmentDirectory: hooks.directory }))
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
  it('renders the reference dashboard sections from today and future appointments', () => {
    render(<DashboardPage />)

    expect(screen.getByRole('heading', { name: 'Atendimentos de hoje' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Próximos agendamentos' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Aguardando confirmação' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Seu negócio hoje' })).toBeInTheDocument()
    expect(screen.getByText('Agendamentos de hoje')).toBeInTheDocument()
    expect(screen.getByText('Valor agendado hoje')).toBeInTheDocument()
    expect(hooks.appointments).toHaveBeenCalledTimes(2)
    expect(hooks.appointments.mock.calls[1][0]).toEqual(expect.objectContaining({ dataInicio: expect.any(String) }))
    expect(hooks.appointments.mock.calls[1][0].dataFim).toBeUndefined()
  })
})
