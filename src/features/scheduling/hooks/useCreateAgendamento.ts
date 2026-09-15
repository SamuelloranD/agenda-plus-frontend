import { useMutation, useQueryClient } from '@tanstack/react-query'
import { schedulingApi } from '../../../services/api/scheduling'
import type { CreateAgendamentoInput } from '../../../types/scheduling'

export function useCreateAgendamento() {
  const queryClient = useQueryClient()
  return useMutation({ mutationFn: (input: CreateAgendamentoInput) => schedulingApi.create(input), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['agendamentos'] }) })
}
