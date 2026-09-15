import { useQuery } from '@tanstack/react-query'
import { schedulingApi } from '../../../services/api/scheduling'

interface AvailabilityQuery { profissionalId?: string; data?: string; servicoId?: string }

export function useHorariosDisponiveis({ profissionalId, data, servicoId }: AvailabilityQuery) {
  const enabled = Boolean(profissionalId && data && servicoId)
  return useQuery({
    queryKey: ['horarios-disponiveis', profissionalId ?? null, data ?? null, servicoId ?? null],
    queryFn: () => schedulingApi.availableTimes({ profissionalId: profissionalId!, data: data!, servicoId: servicoId! }),
    enabled,
  })
}
