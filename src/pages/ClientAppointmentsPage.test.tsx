import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { AgendamentoResponse } from '../types/scheduling'
import { useAuthStore } from '../store/authStore'
import { ClientAppointmentsPage } from './ClientAppointmentsPage'

const hooks = vi.hoisted(() => ({
  appointments: vi.fn(),
  professionals: vi.fn(),
  services: vi.fn(),
  cancel: vi.fn(),
  mutateAsync: vi.fn(),
}))

vi.mock('../features/scheduling/hooks/useAgendamentos', () => ({ useAgendamentos: hooks.appointments }))
vi.mock('../features/professionals/hooks/useProfessionals', () => ({ useProfessionals: hooks.professionals }))
vi.mock('../features/services/hooks/useServices', () => ({ useServices: hooks.services }))
vi.mock('../features/scheduling/hooks/useCancelAgendamento', () => ({ useCancelAgendamento: hooks.cancel }))

const appointment: AgendamentoResponse = {
  id: 'appointment-1',
  inicio: '2099-09-20T14:00:00',
  fim: '2099-09-20T14:45:00',
  profissionalId: 'professional-1',
  clienteId: 'client-1',
  servicoId: 'service-1',
  status: 'CONFIRMADO',
}

const loadedQuery = (data: unknown) => ({
  data,
  isLoading: false,
  isError: false,
  refetch: vi.fn(),
})

beforeEach(() => {
  vi.clearAllMocks()
  useAuthStore.setState({
    token: 'token',
    user: { id: 'client-1', nome: 'Maria Souza', email: 'maria@example.com', role: 'CLIENTE' },
  })
  hooks.appointments.mockReturnValue(loadedQuery({ conteudo: [appointment], pagina: 0, tamanho: 20, totalElementos: 1, totalPaginas: 1 }))
  hooks.professionals.mockReturnValue(loadedQuery([{ id: 'professional-1', nome: 'João Silva', especialidade: 'Cabeleireiro', horariosTrabalho: [] }]))
  hooks.services.mockReturnValue(loadedQuery([{ id: 'service-1', nome: 'Corte de Cabelo', duracaoMinutos: 45, preco: { valor: 80, moeda: 'BRL' } }]))
  hooks.mutateAsync.mockResolvedValue({ ...appointment, status: 'CANCELADO' })
  hooks.cancel.mockReturnValue({ mutateAsync: hooks.mutateAsync, isPending: false })
})

afterEach(cleanup)

describe('ClientAppointmentsPage', () => {
  it('loads appointments with client scope and displays resolved catalog names', () => {
    render(<ClientAppointmentsPage />)

    expect(hooks.appointments).toHaveBeenCalledWith({ clienteId: 'client-1', escopo: 'cliente', pagina: 0, tamanho: 20 })
    expect(screen.getByRole('heading', { name: 'Próximos agendamentos' })).toBeInTheDocument()
    expect(screen.getByText('Corte de Cabelo')).toBeInTheDocument()
    expect(screen.getByText('João Silva')).toBeInTheDocument()
    expect(screen.queryByText(/appointment-1|professional-1|service-1|client-1/)).not.toBeInTheDocument()
  })

  it('keeps loading visible while any required query is loading', () => {
    hooks.services.mockReturnValue({ ...loadedQuery(undefined), isLoading: true })

    render(<ClientAppointmentsPage />)

    expect(screen.getByRole('status')).toHaveTextContent('Preparando seus agendamentos')
    expect(screen.queryByText('Corte de Cabelo')).not.toBeInTheDocument()
  })

  it('shows a recoverable error when a required query fails', () => {
    const refetchAppointments = vi.fn()
    hooks.appointments.mockReturnValue({ ...loadedQuery(undefined), isError: true, refetch: refetchAppointments })

    render(<ClientAppointmentsPage />)
    fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }))

    expect(screen.getByRole('alert')).toHaveTextContent('Não foi possível carregar seus agendamentos')
    expect(refetchAppointments).toHaveBeenCalledTimes(1)
  })

  it('shows an explicit empty state when there are no appointments', () => {
    hooks.appointments.mockReturnValue(loadedQuery({ conteudo: [], pagina: 0, tamanho: 20, totalElementos: 0, totalPaginas: 0 }))

    render(<ClientAppointmentsPage />)

    expect(screen.getByText('Você ainda não possui agendamentos.')).toBeInTheDocument()
  })

  it('confirms cancellation with the selected appointment ID and closes after success', async () => {
    render(<ClientAppointmentsPage />)

    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
    const dialog = screen.getByRole('dialog', { name: 'Cancelar agendamento' })
    expect(dialog).toHaveTextContent('Corte de Cabelo')
    expect(dialog).toHaveTextContent('João Silva')

    fireEvent.click(screen.getByRole('button', { name: 'Confirmar cancelamento' }))

    await waitFor(() => expect(hooks.mutateAsync).toHaveBeenCalledWith('appointment-1'))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(screen.getByText('Corte de Cabelo')).toBeInTheDocument()
  })

  it('keeps the dialog recoverable and shows actionable feedback after cancellation fails', async () => {
    hooks.mutateAsync.mockRejectedValue(new Error('A janela de cancelamento já terminou.'))
    render(<ClientAppointmentsPage />)

    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar cancelamento' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('A janela de cancelamento já terminou.')
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Confirmar cancelamento' })).toBeEnabled()
  })
})
