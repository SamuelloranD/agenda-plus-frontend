import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { AgendamentoResponse } from '../types/scheduling'
import { useAuthStore } from '../store/authStore'
import { ClientAppointmentsPage } from './ClientAppointmentsPage'

const hooks = vi.hoisted(() => ({
  appointments: vi.fn(),
  professionals: vi.fn(),
  services: vi.fn(),
  cancel: vi.fn(),
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

const loadedQuery = (data: unknown) => ({ data, isLoading: false, isError: false, refetch: vi.fn() })

beforeEach(() => {
  vi.clearAllMocks()
  useAuthStore.setState({ token: 'token', user: { id: 'client-1', nome: 'Maria Souza', email: 'maria@example.com', role: 'CLIENTE' } })
  hooks.appointments.mockReturnValue(loadedQuery({ conteudo: [appointment], pagina: 0, tamanho: 20, totalElementos: 1, totalPaginas: 1 }))
  hooks.professionals.mockReturnValue(loadedQuery([{ id: 'professional-1', nome: 'Joao Silva', especialidade: 'Cabeleireiro', horariosTrabalho: [] }]))
  hooks.services.mockReturnValue(loadedQuery([{ id: 'service-1', nome: 'Corte de Cabelo', duracaoMinutos: 45, preco: { valor: 80, moeda: 'BRL' } }]))
  hooks.cancel.mockReturnValue({ mutateAsync: vi.fn(), isPending: false })
})

afterEach(cleanup)

describe('ClientAppointmentsPage', () => {
  it('loads appointments with client scope and displays resolved catalog names', () => {
    render(<ClientAppointmentsPage />)

    expect(hooks.appointments).toHaveBeenCalledWith({ clienteId: 'client-1', escopo: 'cliente', tamanho: 100 }, { allPages: true })
    expect(screen.getByRole('heading', { name: /Pr.*agendamentos/i })).toBeInTheDocument()
    expect(screen.getByText('Corte de Cabelo')).toBeInTheDocument()
    expect(screen.getByText('Joao Silva')).toBeInTheDocument()
  })

  it('does not expose cancellation actions anywhere in the client area', () => {
    render(<ClientAppointmentsPage />)

    expect(screen.queryByRole('button', { name: 'Cancelar' })).not.toBeInTheDocument()
    expect(screen.queryByRole('dialog', { name: /Cancelar agendamento/i })).not.toBeInTheDocument()
  })

  it('filters real appointments by status and search without showing history detail actions', () => {
    hooks.appointments.mockReturnValue(loadedQuery({
      conteudo: [
        appointment,
        { ...appointment, id: 'appointment-2', status: 'PENDENTE', servicoId: 'service-2', inicio: '2020-09-20T14:00:00' },
      ],
      pagina: 0, tamanho: 100, totalElementos: 2, totalPaginas: 1,
    }))
    hooks.services.mockReturnValue(loadedQuery([
      { id: 'service-1', nome: 'Corte de Cabelo', duracaoMinutos: 45, preco: { valor: 80, moeda: 'BRL' } },
      { id: 'service-2', nome: 'Barba', duracaoMinutos: 30, preco: { valor: 60, moeda: 'BRL' } },
    ]))

    render(<ClientAppointmentsPage />)

    expect(screen.getByRole('button', { name: 'Pendentes (1)' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Confirmados (1)' })).toBeInTheDocument()
    expect(screen.getByText('Barba')).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: 'Ver detalhes' })).toHaveLength(1)

    fireEvent.click(screen.getByRole('button', { name: 'Pendentes (1)' }))
    expect(screen.getByText('Barba')).toBeInTheDocument()
    expect(screen.queryByText('Corte de Cabelo')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Ver detalhes' })).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Todos (2)' }))
    fireEvent.change(screen.getByRole('searchbox', { name: 'Buscar agendamentos' }), { target: { value: 'corte' } })
    expect(screen.getByText('Corte de Cabelo')).toBeInTheDocument()
    expect(screen.queryByText('Barba')).not.toBeInTheDocument()
  })

  it('limits results to the selected period', () => {
    const today = new Date()
    const dateAt = (days: number) => {
      const value = new Date(today.getFullYear(), today.getMonth(), today.getDate() + days)
      return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}T14:00:00`
    }
    hooks.appointments.mockReturnValue(loadedQuery({
      conteudo: [
        { ...appointment, id: 'soon', inicio: dateAt(5) },
        { ...appointment, id: 'past', inicio: dateAt(-5), status: 'CONCLUIDO' },
      ],
      pagina: 0, tamanho: 100, totalElementos: 2, totalPaginas: 1,
    }))

    render(<ClientAppointmentsPage />)
    fireEvent.change(screen.getByRole('combobox', { name: 'Filtrar por período' }), { target: { value: 'next7' } })
    expect(screen.getByText('Seu histórico ainda está vazio.')).toBeInTheDocument()
    expect(screen.getByText('1 agendamento')).toBeInTheDocument()

    fireEvent.change(screen.getByRole('combobox', { name: 'Filtrar por período' }), { target: { value: 'past30' } })
    expect(screen.getByText('Nenhum próximo agendamento.')).toBeInTheDocument()
  })

  it('shows a recoverable error when a required query fails', () => {
    const refetchAppointments = vi.fn()
    hooks.appointments.mockReturnValue({ ...loadedQuery(undefined), isError: true, refetch: refetchAppointments })

    render(<ClientAppointmentsPage />)
    fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }))

    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(refetchAppointments).toHaveBeenCalledTimes(1)
  })
})
