import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook } from '@testing-library/react'
import { createElement, type ReactNode } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { schedulingApi } from '../../../services/api/scheduling'
import type { AgendamentoResponse } from '../../../types/scheduling'
import { useCancelAgendamento } from './useCancelAgendamento'

const canceledAppointment: AgendamentoResponse = {
  id: 'appointment-1',
  inicio: '2026-09-16T09:00:00',
  fim: '2026-09-16T09:45:00',
  profissionalId: 'professional-1',
  clienteId: 'client-1',
  servicoId: 'service-1',
  status: 'CANCELADO',
}

afterEach(() => vi.restoreAllMocks())

describe('useCancelAgendamento', () => {
  it('cancels the requested appointment and invalidates appointment queries after success', async () => {
    const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
    const invalidateQueries = vi.spyOn(queryClient, 'invalidateQueries')
    vi.spyOn(schedulingApi, 'cancel').mockResolvedValue(canceledAppointment)
    const wrapper = ({ children }: { children: ReactNode }) => createElement(QueryClientProvider, { client: queryClient }, children)
    const { result } = renderHook(() => useCancelAgendamento(), { wrapper })

    await result.current.mutateAsync('appointment-1')

    expect(schedulingApi.cancel).toHaveBeenCalledWith('appointment-1')
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['agendamentos'] })
  })
})
