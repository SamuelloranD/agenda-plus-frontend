import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
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

const client = { id: '11111111-1111-4111-8111-111111111111', nome: 'Maria Souza', email: 'maria@example.com', role: 'CLIENTE' as const }
const professional = { id: '22222222-2222-4222-8222-222222222222', nome: 'Joao Silva', especialidade: 'Cabeleireiro', horariosTrabalho: [] }
const service = { id: '33333333-3333-4333-8333-333333333333', nome: 'Corte', duracaoMinutos: 45, preco: { valor: 80, moeda: 'BRL' } }

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

describe('NewAppointmentForm success flow', () => {
  it('shows the date and start time supplied by the weekly calendar as fixed values', () => {
    render(<NewAppointmentForm initialDate="2026-09-25" initialStart="08:45" onSuccess={vi.fn()} />)

    expect(screen.getByText('25/09/2026')).toHaveClass('appointment-fixed-field')
    expect(screen.getByText('08:45')).toHaveClass('appointment-fixed-field')
    expect(screen.queryByRole('button', { name: 'Data do atendimento' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /08:45/ })).not.toBeInTheDocument()
    expect(document.querySelector('input[name="inicio"]')).toHaveValue('2026-09-25T08:45:00')
  })

  it('resets the selected fields after a successful appointment creation', async () => {
    const mutate = vi.fn((_values: unknown, options: { onSuccess: () => void }) => options.onSuccess())
    hooks.createAppointment.mockReturnValue({ mutate, isPending: false, isError: false, error: null })
    hooks.availability.mockReturnValue(loadedQuery([{
      inicio: '2099-12-20T10:00:00',
      fim: '2099-12-20T10:45:00',
    }]))

    render(<NewAppointmentForm onSuccess={vi.fn()} />)

    const comboboxes = screen.getAllByRole('combobox')
    fireEvent.click(comboboxes[0])
    fireEvent.click(screen.getByRole('option', { name: /Maria Souza/ }))
    fireEvent.click(comboboxes[1])
    fireEvent.click(screen.getByRole('option', { name: /Corte/ }))
    fireEvent.click(comboboxes[2])
    fireEvent.click(screen.getByRole('option', { name: /Joao Silva/ }))
    fireEvent.click(screen.getByRole('button', { name: /10:00/ }))
    fireEvent.change(document.querySelector('input[name="inicio"]')!, { target: { value: '2099-12-20T10:00:00' } })
    fireEvent.change(document.querySelector('input[name="fim"]')!, { target: { value: '2099-12-20T10:45:00' } })
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar agendamento' }))
    await waitFor(() => expect(mutate).toHaveBeenCalledTimes(1))
    expect(comboboxes[0]).toHaveTextContent(/Selecione quem receber/)
    expect(comboboxes[1]).toHaveTextContent(/Selecione o servi/)
    expect(comboboxes[2]).toHaveTextContent(/Selecione o profissional/)
    expect(screen.queryByRole('button', { name: /10:00/ })).not.toHaveClass('time-option--selected')
  })
})
