import type { ClienteResponse } from '../../types/clients'
import { apiClient } from './client'

export const clientsApi = {
  async list(): Promise<ClienteResponse[]> {
    return (await apiClient.get<ClienteResponse[]>('/clientes')).data
  },
}
