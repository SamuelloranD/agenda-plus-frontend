import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { servicesApi } from '../../../services/api/services'
import type { ServicoInput } from '../../../types/services'

export const servicesQueryKey = ['servicos'] as const
export function useServices() { return useQuery({ queryKey: servicesQueryKey, queryFn: servicesApi.list }) }
export function useCreateService() { const qc = useQueryClient(); return useMutation({ mutationFn: servicesApi.create, onSuccess: () => qc.invalidateQueries({ queryKey: servicesQueryKey }) }) }
export function useUpdateService() { const qc = useQueryClient(); return useMutation({ mutationFn: ({ id, input }: { id: string; input: ServicoInput }) => servicesApi.update(id, input), onSuccess: () => qc.invalidateQueries({ queryKey: servicesQueryKey }) }) }
export function useDeleteService() { const qc = useQueryClient(); return useMutation({ mutationFn: servicesApi.remove, onSuccess: () => qc.invalidateQueries({ queryKey: servicesQueryKey }) }) }
