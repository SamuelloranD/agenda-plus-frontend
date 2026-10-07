export interface HorarioTrabalhoResponse {
  diaSemana: string
  inicio: string
  fim: string
}

export interface ProfissionalResponse {
  id: string
  nome: string
  especialidade: string
  imagem?: string | null
  horariosTrabalho: HorarioTrabalhoResponse[]
}

export interface ProfissionalInput {
  nome: string
  especialidade: string
  imagem: string | null
  horariosTrabalho: HorarioTrabalhoResponse[]
}
