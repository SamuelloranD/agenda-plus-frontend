import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { NewAppointmentForm } from './NewAppointmentForm'

const hooks = vi.hoisted(() => ({ clients: vi.fn(), professionals: vi.fn(), services: vi.fn(), availability: vi.fn(), createAppointment: vi.fn() }))
vi.mock('../../clients/hooks/useClients', () => ({ useClients: hooks.clients }))
vi.mock('../../professionals/hooks/useProfessionals', () => ({ useProfessionals: hooks.professionals }))
vi.mock('../../services/hooks/useServices', () => ({ useServices: hooks.services }))
vi.mock('../hooks/useHorariosDisponiveis', () => ({ useHorariosDisponiveis: hooks.availability }))
vi.mock('../hooks/useCreateAgendamento', () => ({ useCreateAgendamento: hooks.createAppointment }))

const client = { id: 'client-1', nome: 'Maria Souza', email: 'maria@example.com', role: 'CLIENTE' }
const professional = { id: 'professional-1', nome: 'João Silva', especialidade: 'Barbeiro', horariosTrabalho: [] }
const service = { id: 'service-1', nome: 'Corte', duracaoMinutos: 45, preco: { valor: 80, moeda: 'BRL' } }
const availableSlot = { inicio: '2099-12-20T10:00:00', fim: '2099-12-20T10:45:00' }
const query = (data: unknown) => ({ data, isLoading: false, isError: false, refetch: vi.fn() })

beforeEach(() => {
  vi.clearAllMocks()
  hooks.clients.mockReturnValue(query([client]))
  hooks.professionals.mockReturnValue(query([professional]))
  hooks.services.mockReturnValue(query([service]))
  hooks.availability.mockReturnValue(query([availableSlot]))
  hooks.createAppointment.mockReturnValue({ mutateAsync: vi.fn().mockResolvedValue({ status: 'PENDENTE' }), isPending: false })
})
afterEach(cleanup)

function choose(id: string, option: RegExp) {
  fireEvent.click(document.getElementById(id)!)
  fireEvent.click(screen.getByRole('option', { name: option }))
}

describe('NewAppointmentForm', () => {
  it('retries every catalog when loading fails', () => {
    const clients = query(undefined); const professionals = query([]); const services = query([])
    hooks.clients.mockReturnValue({ ...clients, isError: true })
    hooks.professionals.mockReturnValue(professionals)
    hooks.services.mockReturnValue(services)
    render(<NewAppointmentForm onSuccess={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }))
    expect(clients.refetch).toHaveBeenCalledOnce()
    expect(professionals.refetch).toHaveBeenCalledOnce()
    expect(services.refetch).toHaveBeenCalledOnce()
  })

  it('requires a real client and an available slot', () => {
    hooks.clients.mockReturnValue(query([{ ...client, role: 'ADMIN' }]))
    hooks.availability.mockReturnValue(query([]))
    render(<NewAppointmentForm onSuccess={vi.fn()} initialDate="2099-12-20" />)
    expect(screen.getByText('Cadastre um cliente antes de criar o agendamento.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Criar agendamento' })).toBeDisabled()
  })

  it('uses the actual available period when creating a pending appointment', async () => {
    const onSuccess = vi.fn()
    const mutateAsync = vi.fn().mockResolvedValue({ status: 'PENDENTE' })
    hooks.createAppointment.mockReturnValue({ mutateAsync, isPending: false })
    render(<NewAppointmentForm onSuccess={onSuccess} initialDate="2099-12-20" initialStart="10:00" initialProfessionalId={professional.id} />)
    expect(screen.getByRole('button', { name: 'Data do atendimento' })).toBeInTheDocument()
    fireEvent.click(document.getElementById('appointment-client')!)
    fireEvent.change(screen.getByRole('searchbox', { name: /Buscar cliente/ }), { target: { value: 'maria@example.com' } })
    fireEvent.click(screen.getByRole('option', { name: /Maria Souza/ }))
    choose('appointment-service', /Corte/)
    fireEvent.click(screen.getByRole('button', { name: 'Criar agendamento' }))
    await waitFor(() => expect(mutateAsync).toHaveBeenCalledWith({ clienteId: client.id, servicoId: service.id, profissionalId: professional.id, inicio: availableSlot.inicio, fim: availableSlot.fim }))
    expect(onSuccess).toHaveBeenCalledOnce()
  })

  it('blocks a suggested time absent from server availability', () => {
    hooks.availability.mockReturnValue(query([]))
    render(<NewAppointmentForm onSuccess={vi.fn()} initialDate="2099-12-20" initialStart="10:00" initialProfessionalId={professional.id} />)
    expect(screen.getByRole('button', { name: 'Criar agendamento' })).toBeDisabled()
    expect(screen.getByText('O horário selecionado não está disponível. Escolha outro.')).toBeInTheDocument()
  })
})
