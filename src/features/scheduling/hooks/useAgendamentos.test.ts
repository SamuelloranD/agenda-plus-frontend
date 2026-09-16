import { afterEach, describe, expect, it, vi } from 'vitest'
import { schedulingApi } from '../../../services/api/scheduling'
import type { AgendamentoResponse, AgendamentosQuery, PaginaAgendamentosResponse } from '../../../types/scheduling'
import { agendamentosQueryKey, fetchAgendamentos } from './useAgendamentos'

function appointment(id: string): AgendamentoResponse {
  return {
    id,
    inicio: '2026-09-16T09:00:00',
    fim: '2026-09-16T09:45:00',
    profissionalId: 'professional-1',
    clienteId: `client-${id}`,
    servicoId: 'service-1',
    status: 'CONFIRMADO',
  }
}

function page(conteudo: AgendamentoResponse[], pagina: number): PaginaAgendamentosResponse {
  return { conteudo, pagina, tamanho: 100, totalElementos: 3, totalPaginas: 3 }
}

const query: AgendamentosQuery = { dataInicio: '2026-09-14', dataFim: '2026-09-20', tamanho: 100 }

afterEach(() => vi.restoreAllMocks())

describe('useAgendamentos all-pages mode', () => {
  it('fetches every page with the API-safe size and merges the result', async () => {
    vi.spyOn(schedulingApi, 'list').mockImplementation(async ({ pagina = 0 }) => page([appointment(`appointment-${pagina + 1}`)], pagina))

    const result = await fetchAgendamentos(query, { allPages: true })

    expect(result.conteudo.map(({ id }) => id)).toEqual(['appointment-1', 'appointment-2', 'appointment-3'])
    expect(schedulingApi.list).toHaveBeenCalledTimes(3)
    expect(schedulingApi.list).toHaveBeenNthCalledWith(1, { ...query, pagina: 0, tamanho: 100 })
    expect(schedulingApi.list).toHaveBeenNthCalledWith(3, { ...query, pagina: 2, tamanho: 100 })
  })

  it('keeps page-size normalization and all-pages mode in the query key', () => {
    expect(agendamentosQueryKey({ ...query, tamanho: 200 }, { allPages: true })).toEqual(agendamentosQueryKey(query, { allPages: true }))
    expect(agendamentosQueryKey(query, { allPages: true })).not.toEqual(agendamentosQueryKey(query))
  })
})
