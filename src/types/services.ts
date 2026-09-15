export interface PrecoResponse {
  valor: number
  moeda: string
}

export interface ServicoResponse {
  id: string
  nome: string
  duracaoMinutos: number
  preco: PrecoResponse
}

export interface ServicoInput {
  nome: string
  duracaoMinutos: number
  preco: PrecoResponse
}
