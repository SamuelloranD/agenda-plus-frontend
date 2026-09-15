import type { CreateAgendamentoInput, AgendamentoResponse, AgendamentosQuery, HorarioDisponivelResponse, PaginaAgendamentosResponse } from '../../types/scheduling'
import { apiClient } from './client'

export const schedulingApi = {
  async list(query: AgendamentosQuery): Promise<PaginaAgendamentosResponse> {
    const { data } = await apiClient.get<PaginaAgendamentosResponse>('/agendamentos', { params: query })
    return data
  },
  async create(input: CreateAgendamentoInput): Promise<AgendamentoResponse> {
    const { data } = await apiClient.post<AgendamentoResponse>('/agendamentos', input)
    return data
  },
  async availableTimes(input: { profissionalId: string; data: string; servicoId: string }): Promise<HorarioDisponivelResponse[]> {
    const { data } = await apiClient.get<HorarioDisponivelResponse[]>(`/profissionais/${input.profissionalId}/horarios-disponiveis`, { params: { data: input.data, servicoId: input.servicoId } })
    return data
  },
}
