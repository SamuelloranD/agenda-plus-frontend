import type { HorarioTrabalhoResponse } from '../../../types/professionals'
import { weekdays } from '../schemas/professionalSchema'

const labels = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']

export function scheduleSummary(intervals: HorarioTrabalhoResponse[]) {
  const days = weekdays.map((day) => intervals
    .filter(({ diaSemana }) => diaSemana === day)
    .sort((left, right) => left.inicio.localeCompare(right.inicio))
    .map(({ inicio, fim }) => `${inicio.slice(0, 5)}–${fim.slice(0, 5)}`))
  const lines: string[] = []
  for (let index = 0; index < days.length;) {
    if (days[index].length === 0) { index += 1; continue }
    const signature = days[index].join(' e ')
    let last = index
    while (last + 1 < days.length && days[last + 1].join(' e ') === signature) last += 1
    lines.push(`${labels[index]}${last > index ? `–${labels[last]}` : ''} · ${signature}`)
    index = last + 1
  }
  return lines
}
