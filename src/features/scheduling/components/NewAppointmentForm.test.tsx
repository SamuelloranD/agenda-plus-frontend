import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { NewAppointmentForm } from './NewAppointmentForm'

const hooks = vi.hoisted(() => ({
  clients: vi.fn(),
  professionals: vi.fn(),
  services: vi.fn(),
  availability: vi.fn(),
  createAppointment: vi.fn(),
}))

vi.mock('../../clients/hooks/useClients', () => ({ useClients: hooks.clients }))
vi.mock('../../professionals/hooks/useProfessionals', () => ({ useProfessionals: hooks.professionals }))
vi.mock('../../services/hooks/useServices', () => ({ useServices: hooks.services }))
vi.mock('../hooks/useHorariosDisponiveis', () => ({ useHorariosDisponiveis: hooks.availability }))
vi.mock('../hooks/useCreateAgendamento', () => ({ useCreateAgendamento: hooks.createAppointment }))

const client = { id: 'client-1', nome: 'Maria Souza', email: 'maria@example.com', role: 'CLIENTE' as const }
const professional = { id: 'professional-1', nome: 'Joao Silva', especialidade: 'Cabeleireiro', horariosTrabalho: [] }
const service = { id: 'service-1', nome: 'Corte', duracaoMinutos: 45, preco: { valor: 80, moeda: 'BRL' } }

function loadedQuery(data: unknown) {
  return { data, isLoading: false, isError: false, refetch: vi.fn() }
}

beforeEach(() => {
  vi.clearAllMocks()
  hooks.clients.mockReturnValue(loadedQuery([client]))
  hooks.professionals.mockReturnValue(loadedQuery([professional]))
  hooks.services.mockReturnValue(loadedQuery([service]))
  hooks.availability.mockReturnValue(loadedQuery([]))
  hooks.createAppointment.mockReturnValue({ mutate: vi.fn(), isPending: false, isError: false, error: null })
})

afterEach(cleanup)

describe('NewAppointmentForm catalog states', () => {
  it('offers one retry that reloads every required catalog after a load error', () => {
    const refetchClients = vi.fn()
    const refetchProfessionals = vi.fn()
    const refetchServices = vi.fn()
    hooks.clients.mockReturnValue({ ...loadedQuery(undefined), isError: true, refetch: refetchClients })
    hooks.professionals.mockReturnValue({ ...loadedQuery([professional]), refetch: refetchProfessionals })
    hooks.services.mockReturnValue({ ...loadedQuery([service]), refetch: refetchServices })

    render(<NewAppointmentForm onSuccess={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }))

    expect(screen.getByRole('alert')).toHaveTextContent('Não foi possível abrir os dados necessários')
    expect(refetchClients).toHaveBeenCalledTimes(1)
    expect(refetchProfessionals).toHaveBeenCalledTimes(1)
    expect(refetchServices).toHaveBeenCalledTimes(1)
  })

  it('shows every missing prerequisite instead of an unusable form', () => {
    hooks.clients.mockReturnValue(loadedQuery([]))
    hooks.professionals.mockReturnValue(loadedQuery([]))
    hooks.services.mockReturnValue(loadedQuery([]))

    render(<NewAppointmentForm onSuccess={vi.fn()} />)

    expect(screen.getByText('Cadastre um cliente, um profissional e um serviço antes de criar um agendamento.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Confirmar agendamento' })).not.toBeInTheDocument()
  })

  it('does not count an administrative account as an eligible client', () => {
    hooks.clients.mockReturnValue(loadedQuery([
      { id: 'admin-1', nome: 'Mateus Silva', email: 'mateus@example.com', role: 'ADMIN' },
    ]))

    render(<NewAppointmentForm onSuccess={vi.fn()} />)

    expect(screen.getByText('Cadastre um cliente antes de criar um agendamento.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Confirmar agendamento' })).not.toBeInTheDocument()
  })
})
