import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { professionalsApi } from '../../../services/api/professionals'
import type { ProfissionalInput } from '../../../types/professionals'

export const professionalsQueryKey = ['profissionais'] as const
export function useProfessionals() { return useQuery({ queryKey: professionalsQueryKey, queryFn: professionalsApi.list }) }
export function useCreateProfessional() { const qc = useQueryClient(); return useMutation({ mutationFn: professionalsApi.create, onSuccess: () => qc.invalidateQueries({ queryKey: professionalsQueryKey }) }) }
export function useUpdateProfessional() { const qc = useQueryClient(); return useMutation({ mutationFn: ({ id, input }: { id: string; input: ProfissionalInput }) => professionalsApi.update(id, input), onSuccess: () => qc.invalidateQueries({ queryKey: professionalsQueryKey }) }) }
export function useDeleteProfessional() { const qc = useQueryClient(); return useMutation({ mutationFn: professionalsApi.remove, onSuccess: () => qc.invalidateQueries({ queryKey: professionalsQueryKey }) }) }
