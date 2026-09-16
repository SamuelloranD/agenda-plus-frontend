import type { AgendamentoResponse, HorarioDisponivelResponse } from '../../types/scheduling'
import type { ProfissionalResponse } from '../../types/professionals'
import type { ServicoResponse } from '../../types/services'

export const ANY_PROFESSIONAL_ID = 'any'

export type BookingStep = 'service' | 'professional' | 'time'

export interface AggregatedAvailabilitySlot extends HorarioDisponivelResponse {
  key: string
  candidates: ProfissionalResponse[]
}

export interface SelectedAvailabilitySlot extends AggregatedAvailabilitySlot {
  profissionalId: string
}

export type AvailabilityByProfessional = Record<string, HorarioDisponivelResponse[] | undefined>

export interface ClientBookingSelection {
  service: ServicoResponse | null
  professionalChoice: string | null
  date: string
  slot: SelectedAvailabilitySlot | null
}

export interface ConfirmedClientBooking {
  appointment: AgendamentoResponse
  service: ServicoResponse
  professional: ProfissionalResponse
}
