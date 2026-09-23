import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query'
import { schedulingApi } from '../../../services/api/scheduling'
import type { ApiError } from '../../../types/api'
import type { AgendamentoResponse } from '../../../types/scheduling'

export function useConfirmAgendamento(): UseMutationResult<AgendamentoResponse, ApiError, string> {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => schedulingApi.confirm(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['agendamentos'] }),
  })
}
