import type { ProfissionalResponse } from '../../../types/professionals'
import type { AggregatedAvailabilitySlot, AvailabilityByProfessional } from '../types'

export function aggregateAvailability(
  professionals: ProfissionalResponse[],
  availabilityByProfessional: AvailabilityByProfessional,
): AggregatedAvailabilitySlot[] {
  const slots = new Map<string, AggregatedAvailabilitySlot>()

  professionals.forEach((professional) => {
    availabilityByProfessional[professional.id]?.forEach(({ inicio, fim }) => {
      const key = `${inicio}|${fim}`
      const existing = slots.get(key)

      if (existing) {
        existing.candidates.push(professional)
        return
      }

      slots.set(key, { key, inicio, fim, candidates: [professional] })
    })
  })

  return [...slots.values()]
}
