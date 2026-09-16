import { useQuery } from '@tanstack/react-query'
import { schedulingApi } from '../../../services/api/scheduling'
import type { AgendamentosQuery, PaginaAgendamentosResponse } from '../../../types/scheduling'

const MAX_PAGE_SIZE = 100

export interface UseAgendamentosOptions {
  allPages?: boolean
}

function safePageSize(size?: number) {
  return Math.min(Math.max(size ?? 20, 1), MAX_PAGE_SIZE)
}

export const agendamentosQueryKey = (query: AgendamentosQuery, options: UseAgendamentosOptions = {}) => [
  'agendamentos',
  query.dataInicio,
  query.dataFim,
  query.profissionalId ?? null,
  options.allPages ? 0 : query.pagina ?? 0,
  safePageSize(query.tamanho),
  Boolean(options.allPages),
] as const

function pageQuery(query: AgendamentosQuery, pagina: number) {
  return { ...query, pagina, tamanho: safePageSize(query.tamanho) }
}

export async function fetchAgendamentos(query: AgendamentosQuery, options: UseAgendamentosOptions = {}): Promise<PaginaAgendamentosResponse> {
  const firstPage = await schedulingApi.list(pageQuery(query, options.allPages ? 0 : query.pagina ?? 0))
  if (!options.allPages || firstPage.totalPaginas <= 1) {
    return firstPage
  }

  const pages = [firstPage]
  for (let pagina = 1; pagina < firstPage.totalPaginas; pagina += 1) {
    pages.push(await schedulingApi.list(pageQuery(query, pagina)))
  }

  return {
    ...firstPage,
    pagina: 0,
    tamanho: safePageSize(query.tamanho),
    conteudo: pages.flatMap(({ conteudo }) => conteudo),
  }
}

export function useAgendamentos(query: AgendamentosQuery, options: UseAgendamentosOptions = {}) {
  return useQuery({ queryKey: agendamentosQueryKey(query, options), queryFn: () => fetchAgendamentos(query, options) })
}
