import { useQuery } from '@tanstack/react-query'
import { clientsApi } from '../../../services/api/clients'

export const clientsQueryKey = ['clientes'] as const

export function useClients() {
  return useQuery({ queryKey: clientsQueryKey, queryFn: clientsApi.list })
}
