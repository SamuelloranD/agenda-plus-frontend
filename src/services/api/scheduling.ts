import type { CreateAgendamentoInput, AgendamentoResponse, AgendamentosQuery, ClientAgendamentosQuery, HorarioDisponivelResponse, PaginaAgendamentosResponse } from '../../types/scheduling'
import { apiClient } from './client'

export const schedulingApi = {
  async list(query: AgendamentosQuery): Promise<PaginaAgendamentosResponse> {
    const { data } = await apiClient.get<PaginaAgendamentosResponse>('/agendamentos', { params: query })
    return data
  },
  async listMine(query: ClientAgendamentosQuery): Promise<PaginaAgendamentosResponse> {
    const { data } = await apiClient.get<PaginaAgendamentosResponse>('/agendamentos/meus', { params: query })
    return data
  },
  async create(input: CreateAgendamentoInput): Promise<AgendamentoResponse> {
    const { data } = await apiClient.post<AgendamentoResponse>('/agendamentos', input)
    return data
  },
  async confirm(id: string): Promise<AgendamentoResponse> {
    const { data } = await apiClient.patch<AgendamentoResponse>(`/agendamentos/${id}/confirmar`)
    return data
  },
  async cancel(id: string): Promise<AgendamentoResponse> {
    const { data } = await apiClient.patch<AgendamentoResponse>(`/agendamentos/${id}/cancelar`)
    return data
  },
  async availableTimes(input: { profissionalId: string; data: string; servicoId: string }): Promise<HorarioDisponivelResponse[]> {
    const { data } = await apiClient.get<HorarioDisponivelResponse[]>(`/profissionais/${input.profissionalId}/horarios-disponiveis`, { params: { data: input.data, servicoId: input.servicoId } })
    return data
  },
}
