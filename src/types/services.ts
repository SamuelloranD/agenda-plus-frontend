export interface PrecoResponse {
  valor: number
  moeda: string
}

export interface ServicoResponse {
  id: string
  nome: string
  duracaoMinutos: number
  preco: PrecoResponse
  descricao?: string | null
  ativo?: boolean
}

export interface ServicoInput {
  nome: string
  duracaoMinutos: number
  preco: PrecoResponse
  descricao?: string | null
  ativo?: boolean
}
