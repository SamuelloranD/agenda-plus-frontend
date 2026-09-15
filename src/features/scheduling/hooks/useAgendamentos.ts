import { useQuery } from '@tanstack/react-query'
import { schedulingApi } from '../../../services/api/scheduling'
import type { AgendamentosQuery } from '../../../types/scheduling'

export const agendamentosQueryKey = (query: AgendamentosQuery) => ['agendamentos', query.dataInicio, query.dataFim, query.profissionalId ?? null, query.pagina ?? 0, query.tamanho ?? 20] as const

export function useAgendamentos(query: AgendamentosQuery) {
  return useQuery({ queryKey: agendamentosQueryKey(query), queryFn: () => schedulingApi.list(query) })
}
