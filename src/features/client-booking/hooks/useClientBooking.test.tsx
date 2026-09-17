import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { schedulingApi } from '../../../services/api/scheduling'
import type { User } from '../../../types/auth'
import type { ProfissionalResponse } from '../../../types/professionals'
import type { ServicoResponse } from '../../../types/services'
import { useSession } from '../../auth/hooks/useSession'
import { useCreateAgendamento } from '../../scheduling/hooks/useCreateAgendamento'
import { useProfessionals } from '../../professionals/hooks/useProfessionals'
import { useServices } from '../../services/hooks/useServices'
import { useClientBooking } from './useClientBooking'

vi.mock('../../../services/api/scheduling', () => ({
  schedulingApi: {
    availableTimes: vi.fn(),
  },
}))

vi.mock('../../auth/hooks/useSession', () => ({
  useSession: vi.fn(),
}))

vi.mock('../../scheduling/hooks/useCreateAgendamento', () => ({
  useCreateAgendamento: vi.fn(),
}))

vi.mock('../../professionals/hooks/useProfessionals', () => ({
  useProfessionals: vi.fn(),
}))

vi.mock('../../services/hooks/useServices', () => ({
  useServices: vi.fn(),
}))

const service: ServicoResponse = {
  id: 'service-1',
  nome: 'Corte de cabelo',
  duracaoMinutos: 60,
  preco: { valor: 80, moeda: 'BRL' },
}

const professionals: ProfissionalResponse[] = [
  { id: 'professional-1', nome: 'João Silva', especialidade: 'Corte', horariosTrabalho: [] },
  { id: 'professional-2', nome: 'Ana Lima', especialidade: 'Corte', horariosTrabalho: [] },
]

const client: User = {
  id: 'client-1',
  nome: 'Cliente Agenda',
  email: 'cliente@agenda.plus',
  role: 'CLIENTE',
}

const admin: User = {
  id: 'admin-1',
  nome: 'Mestre Agenda',
  email: 'mestre@agenda.plus',
  role: 'ADMIN',
}

const appointment = {
  id: 'appointment-1',
  inicio: '2026-09-20T10:00:00',
  fim: '2026-09-20T11:00:00',
  profissionalId: 'professional-1',
  clienteId: 'client-1',
  servicoId: 'service-1',
  status: 'PENDENTE' as const,
}

const availableSlot = {
  inicio: '2026-09-20T10:00:00',
  fim: '2026-09-20T11:00:00',
}

function wrapper({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}

function configureMocks(user: User | null, mutateAsync = vi.fn()) {
  vi.mocked(useSession).mockReturnValue({
    token: user ? 'token' : null,
    user,
    setSession: vi.fn(),
    clearSession: vi.fn(),
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  } as ReturnType<typeof useSession>)
  vi.mocked(useServices).mockReturnValue({ data: [service], isLoading: false, isError: false, refetch: vi.fn() } as unknown as ReturnType<typeof useServices>)
  vi.mocked(useProfessionals).mockReturnValue({ data: professionals, isLoading: false, isError: false, refetch: vi.fn() } as unknown as ReturnType<typeof useProfessionals>)
  vi.mocked(useCreateAgendamento).mockReturnValue({ mutateAsync, isPending: false, error: null } as unknown as ReturnType<typeof useCreateAgendamento>)
  vi.mocked(schedulingApi.availableTimes).mockImplementation(async () => [availableSlot])
}

beforeEach(() => {
  sessionStorage.clear()
})

afterEach(() => {
  vi.clearAllMocks()
  sessionStorage.clear()
})

describe('useClientBooking', () => {
  it('restores the selected booking after the wizard remounts with a CLIENTE session', async () => {
    configureMocks(null)
    const firstRender = renderHook(() => useClientBooking(), { wrapper })

    act(() => firstRender.result.current.selectService(service))
    act(() => firstRender.result.current.selectProfessional('professional-1'))
    await waitFor(() => expect(firstRender.result.current.slots).toHaveLength(1))
    act(() => firstRender.result.current.selectSlot(firstRender.result.current.slots[0]))
    await waitFor(() => expect(JSON.parse(sessionStorage.getItem('agenda-plus:client-booking-draft') ?? '{}')).toMatchObject({
      service,
      professionalChoice: 'professional-1',
      slot: { profissionalId: 'professional-1' },
    }))
    firstRender.unmount()

    vi.mocked(useSession).mockReturnValue({
      token: 'client-token',
      user: client,
      setSession: vi.fn(),
      clearSession: vi.fn(),
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as ReturnType<typeof useSession>)
    const secondRender = renderHook(() => useClientBooking(), { wrapper })

    expect(secondRender.result.current.selection).toMatchObject({
      service,
      professionalChoice: 'professional-1',
      slot: { profissionalId: 'professional-1' },
    })
  })

  it('does not create an appointment for an authenticated ADMIN', async () => {
    const mutateAsync = vi.fn()
    configureMocks(admin, mutateAsync)
    const { result } = renderHook(() => useClientBooking(), { wrapper })

    act(() => result.current.selectService(service))
    act(() => result.current.selectProfessional('professional-1'))
    await waitFor(() => expect(result.current.slots).toHaveLength(1))
    act(() => result.current.selectSlot(result.current.slots[0]))

    await act(async () => {
      await expect(result.current.confirmBooking()).resolves.toBeNull()
    })

    expect(mutateAsync).not.toHaveBeenCalled()
  })

  it('confirms a CLIENTE booking with a concrete professional selected from any-professional availability', async () => {
    const mutateAsync = vi.fn().mockResolvedValue(appointment)
    configureMocks(client, mutateAsync)
    const { result } = renderHook(() => useClientBooking(), { wrapper })

    act(() => result.current.selectService(service))
    act(() => result.current.selectProfessional('any'))
    await waitFor(() => expect(result.current.slots).toHaveLength(1))
    expect(schedulingApi.availableTimes).toHaveBeenCalledTimes(2)
    expect(schedulingApi.availableTimes).toHaveBeenCalledWith({
      profissionalId: 'professional-1',
      data: result.current.selection.date,
      servicoId: service.id,
    })
    expect(schedulingApi.availableTimes).toHaveBeenCalledWith({
      profissionalId: 'professional-2',
      data: result.current.selection.date,
      servicoId: service.id,
    })
    expect(result.current.slots[0].candidates).toEqual(professionals)
    act(() => result.current.selectSlot(result.current.slots[0]))

    await act(async () => {
      await result.current.confirmBooking()
    })

    expect(mutateAsync).toHaveBeenCalledWith({
      inicio: availableSlot.inicio,
      fim: availableSlot.fim,
      profissionalId: 'professional-1',
      clienteId: client.id,
      servicoId: service.id,
    })
    expect(result.current.confirmation).toMatchObject({
      appointment,
      service,
      professional: professionals[0],
    })
  })
})
