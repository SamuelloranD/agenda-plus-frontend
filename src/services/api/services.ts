import type { ServicoInput, ServicoResponse } from '../../types/services'
import { apiClient } from './client'

export const servicesApi = {
  async list(): Promise<ServicoResponse[]> { return (await apiClient.get<ServicoResponse[]>('/servicos')).data },
  async get(id: string): Promise<ServicoResponse> { return (await apiClient.get<ServicoResponse>(`/servicos/${id}`)).data },
  async create(input: ServicoInput): Promise<ServicoResponse> { return (await apiClient.post<ServicoResponse>('/servicos', input)).data },
  async update(id: string, input: ServicoInput): Promise<ServicoResponse> { return (await apiClient.put<ServicoResponse>(`/servicos/${id}`, input)).data },
  async remove(id: string): Promise<void> { await apiClient.delete(`/servicos/${id}`) },
}
