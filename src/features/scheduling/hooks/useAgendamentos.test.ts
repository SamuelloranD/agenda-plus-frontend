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

describe('useAgendamentos query scope', () => {
  it('uses different cache keys for different clients without including a JWT', () => {
    const token = 'header.payload.signature'
    const firstClientKey = agendamentosQueryKey({ escopo: 'cliente', clienteId: 'client-1', pagina: 2, tamanho: 200 })
    const secondClientKey = agendamentosQueryKey({ escopo: 'cliente', clienteId: 'client-2', pagina: 2, tamanho: 200 })

    expect(firstClientKey).not.toEqual(secondClientKey)
    expect(firstClientKey).toEqual([
      'agendamentos',
      'cliente',
      'client-1',
      null,
      null,
      null,
      2,
      100,
      false,
    ])
    expect(JSON.stringify(firstClientKey)).not.toContain(token)
  })

  it('keeps the admin scope on the administrative API', async () => {
    const adminQuery: AgendamentosQuery = {
      escopo: 'admin',
      dataInicio: '2026-09-14',
      dataFim: '2026-09-20',
      profissionalId: 'professional-1',
      pagina: 1,
      tamanho: 25,
    }
    vi.spyOn(schedulingApi, 'list').mockResolvedValue({ ...page([appointment('admin')], 1), totalPaginas: 1 })

    await fetchAgendamentos(adminQuery)

    expect(schedulingApi.list).toHaveBeenCalledWith({
      dataInicio: '2026-09-14',
      dataFim: '2026-09-20',
      profissionalId: 'professional-1',
      pagina: 1,
      tamanho: 25,
    })
  })

  it('uses the client API and preserves pagination in all-pages mode', async () => {
    const clientQuery: AgendamentosQuery = { escopo: 'cliente', clienteId: 'client-1', tamanho: 200 }
    vi.spyOn(schedulingApi, 'list').mockRejectedValue(new Error('admin API must not be used for client scope'))
    vi.spyOn(schedulingApi, 'listMine').mockImplementation(async ({ pagina = 0 }) => ({
      ...page([appointment(`client-${pagina + 1}`)], pagina),
      totalPaginas: 2,
    }))

    const result = await fetchAgendamentos(clientQuery, { allPages: true })

    expect(result.conteudo.map(({ id }) => id)).toEqual(['client-1', 'client-2'])
    expect(result.pagina).toBe(0)
    expect(result.tamanho).toBe(100)
    expect(schedulingApi.listMine).toHaveBeenNthCalledWith(1, { pagina: 0, tamanho: 100 })
    expect(schedulingApi.listMine).toHaveBeenNthCalledWith(2, { pagina: 1, tamanho: 100 })
    expect(schedulingApi.list).not.toHaveBeenCalled()
  })
})
