export type AgendamentoStatus = 'PENDENTE' | 'CONFIRMADO' | 'CANCELADO' | 'CONCLUIDO'

export interface AgendamentoResponse {
  id: string
  inicio: string
  fim: string
  profissionalId: string
  clienteId: string
  servicoId: string
  status: AgendamentoStatus
}

export interface PaginaAgendamentosResponse {
  conteudo: AgendamentoResponse[]
  pagina: number
  tamanho: number
  totalElementos: number
  totalPaginas: number
}

export interface HorarioDisponivelResponse {
  inicio: string
  fim: string
}

export interface CreateAgendamentoInput {
  inicio: string
  fim: string
  profissionalId: string
  clienteId: string
  servicoId: string
}

export interface AgendamentosQuery {
  dataInicio: string
  dataFim: string
  profissionalId?: string
  pagina?: number
  tamanho?: number
}
