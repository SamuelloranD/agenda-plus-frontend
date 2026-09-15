import type { ProfissionalInput, ProfissionalResponse } from '../../types/professionals'
import { apiClient } from './client'

export const professionalsApi = {
  async list(): Promise<ProfissionalResponse[]> { return (await apiClient.get<ProfissionalResponse[]>('/profissionais')).data },
  async get(id: string): Promise<ProfissionalResponse> { return (await apiClient.get<ProfissionalResponse>(`/profissionais/${id}`)).data },
  async create(input: ProfissionalInput): Promise<ProfissionalResponse> { return (await apiClient.post<ProfissionalResponse>('/profissionais', input)).data },
  async update(id: string, input: ProfissionalInput): Promise<ProfissionalResponse> { return (await apiClient.put<ProfissionalResponse>(`/profissionais/${id}`, input)).data },
  async remove(id: string): Promise<void> { await apiClient.delete(`/profissionais/${id}`) },
}
