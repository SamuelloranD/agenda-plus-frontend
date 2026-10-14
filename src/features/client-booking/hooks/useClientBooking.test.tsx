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
import { addCalendarDays, todayKey } from '../utils/bookingTime'

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
  inicio: '2099-09-20T10:00:00',
  fim: '2099-09-20T11:00:00',
  profissionalId: 'professional-1',
  clienteId: 'client-1',
  servicoId: 'service-1',
  status: 'PENDENTE' as const,
}

const availableSlot = {
  inicio: '2099-09-20T10:00:00',
  fim: '2099-09-20T11:00:00',
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
  it('keeps each choice visible until the summary advances the step', () => {
    configureMocks(client)
    const { result } = renderHook(() => useClientBooking(), { wrapper })

    act(() => result.current.selectService(service))
    expect(result.current.step).toBe('service')
    act(() => result.current.goToStep('professional'))
    expect(result.current.step).toBe('professional')
    act(() => result.current.selectProfessional('professional-1'))
    expect(result.current.step).toBe('professional')
    act(() => result.current.goToStep('time'))
    expect(result.current.step).toBe('time')
  })

  it('starts a clean booking after a completed request', async () => {
    const mutateAsync = vi.fn().mockResolvedValue(appointment)
    configureMocks(client, mutateAsync)
    const { result } = renderHook(() => useClientBooking(), { wrapper })
    act(() => result.current.selectService(service))
    act(() => result.current.selectProfessional('professional-1'))
    await waitFor(() => expect(result.current.slots).toHaveLength(1))
    act(() => result.current.selectSlot(result.current.slots[0]))
    await act(async () => { await result.current.confirmBooking() })

    act(() => result.current.startOver())
    expect(result.current.step).toBe('service')
    expect(result.current.confirmation).toBeNull()
    expect(result.current.selection.service).toBeNull()
    expect(result.current.selection.slot).toBeNull()
  })

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

  it('keeps the booking pending when the selected slot disappeared before submission', async () => {
    const mutateAsync = vi.fn()
    configureMocks(client, mutateAsync)
    const { result } = renderHook(() => useClientBooking(), { wrapper })
    act(() => result.current.selectService(service))
    act(() => result.current.selectProfessional('professional-1'))
    await waitFor(() => expect(result.current.slots).toHaveLength(1))
    act(() => result.current.selectSlot(result.current.slots[0]))
    vi.mocked(schedulingApi.availableTimes).mockResolvedValue([])

    await act(async () => {
      await expect(result.current.confirmBooking()).resolves.toBeNull()
    })

    expect(mutateAsync).not.toHaveBeenCalled()
    expect(result.current.selection.slot).toBeNull()
    expect(result.current.bookingError).toMatch(/não está mais disponível/i)
  })

  it('finds the first afternoon slot on a later day without generating slots', async () => {
    configureMocks(client)
    const nextDate = addCalendarDays(todayKey(), 1)
    vi.mocked(schedulingApi.availableTimes).mockImplementation(async ({ data }) => data === nextDate ? [
      { inicio: `${nextDate}T09:00:00`, fim: `${nextDate}T10:00:00` },
      { inicio: `${nextDate}T13:00:00`, fim: `${nextDate}T14:00:00` },
    ] : [])
    const { result } = renderHook(() => useClientBooking(), { wrapper })
    act(() => result.current.selectService(service))
    act(() => result.current.selectProfessional('professional-1'))

    await act(async () => { await result.current.findNextAvailable('afternoon') })

    expect(result.current.selection.date).toBe(nextDate)
    expect(result.current.selection.slot?.inicio).toBe(`${nextDate}T13:00:00`)
  })

  it('keeps available professionals visible when another agenda fails', async () => {
    configureMocks(client)
    vi.mocked(schedulingApi.availableTimes).mockImplementation(async ({ profissionalId }) => {
      if (profissionalId === 'professional-1') throw new Error('Agenda indisponível')
      return [availableSlot]
    })
    const { result } = renderHook(() => useClientBooking(), { wrapper })
    act(() => result.current.selectService(service))
    act(() => result.current.selectProfessional('any'))

    await waitFor(() => expect(result.current.availability.isLoading).toBe(false))
    expect(result.current.slots).toHaveLength(1)
    expect(result.current.slots[0].candidates).toEqual([professionals[1]])
    expect(result.current.availability.isError).toBe(false)
    expect(result.current.availability.isPartialError).toBe(true)

    await act(async () => { await result.current.findNextAvailable('all') })
    expect(result.current.selection.slot?.profissionalId).toBe('professional-2')
  })

  it('finds availability after the fourteenth day', async () => {
    configureMocks(client)
    const laterDate = addCalendarDays(todayKey(), 15)
    vi.mocked(schedulingApi.availableTimes).mockImplementation(async ({ data }) => data === laterDate ? [
      { inicio: `${laterDate}T09:00:00`, fim: `${laterDate}T10:00:00` },
    ] : [])
    const { result } = renderHook(() => useClientBooking(), { wrapper })
    act(() => result.current.selectService(service))
    act(() => result.current.selectProfessional('professional-1'))

    await act(async () => { await result.current.findNextAvailable('all') })

    expect(result.current.selection.date).toBe(laterDate)
    expect(result.current.selection.slot?.inicio).toBe(`${laterDate}T09:00:00`)
  })

  it('sends only one request when submission is triggered twice', async () => {
    const mutateAsync = vi.fn().mockResolvedValue(appointment)
    configureMocks(client, mutateAsync)
    const { result } = renderHook(() => useClientBooking(), { wrapper })
    act(() => result.current.selectService(service))
    act(() => result.current.selectProfessional('professional-1'))
    await waitFor(() => expect(result.current.slots).toHaveLength(1))
    act(() => result.current.selectSlot(result.current.slots[0]))

    await act(async () => {
      const first = result.current.confirmBooking()
      const second = result.current.confirmBooking()
      expect(await second).toBeNull()
      await first
    })

    expect(mutateAsync).toHaveBeenCalledTimes(1)
  })

  it('locks the chosen booking while availability is rechecked for submission', async () => {
    const mutateAsync = vi.fn().mockResolvedValue(appointment)
    configureMocks(client, mutateAsync)
    const { result } = renderHook(() => useClientBooking(), { wrapper })
    act(() => result.current.selectService(service))
    act(() => result.current.selectProfessional('professional-1'))
    await waitFor(() => expect(result.current.slots).toHaveLength(1))
    act(() => result.current.selectSlot(result.current.slots[0]))
    act(() => result.current.goToStep('time'))

    let resolveTimes!: (times: typeof availableSlot[]) => void
    vi.mocked(schedulingApi.availableTimes).mockImplementation(() => new Promise((resolve) => { resolveTimes = resolve }))
    let bookingPromise!: Promise<unknown>
    act(() => { bookingPromise = result.current.confirmBooking() })
    expect(result.current.isSubmitting).toBe(true)

    act(() => {
      result.current.goToStep('service')
      result.current.selectService({ ...service, id: 'service-2' })
      result.current.selectProfessional('professional-2')
      result.current.selectDate('2099-09-21')
      result.current.selectSlot(result.current.slots[0])
    })
    expect(result.current.step).toBe('time')
    expect(result.current.selection).toMatchObject({
      service,
      professionalChoice: 'professional-1',
      date: todayKey(),
      slot: { profissionalId: 'professional-1' },
    })

    await act(async () => { resolveTimes([availableSlot]); await bookingPromise })
    expect(mutateAsync).toHaveBeenCalledWith(expect.objectContaining({
      profissionalId: 'professional-1',
      servicoId: service.id,
    }))
    expect(result.current.confirmation?.service).toEqual(service)
  })

  it('preserves a valid slot when editing and reselecting the same service and professional', async () => {
    configureMocks(client)
    const { result } = renderHook(() => useClientBooking(), { wrapper })
    act(() => result.current.selectService(service))
    act(() => result.current.selectProfessional('professional-1'))
    await waitFor(() => expect(result.current.slots).toHaveLength(1))
    act(() => result.current.selectSlot(result.current.slots[0]))

    act(() => result.current.goToStep('service'))
    act(() => result.current.selectService(service))
    act(() => result.current.selectProfessional('professional-1'))

    expect(result.current.selection.slot?.inicio).toBe(availableSlot.inicio)
  })
})
