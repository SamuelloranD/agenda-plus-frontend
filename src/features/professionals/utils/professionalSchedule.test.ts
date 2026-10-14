import { expect, it } from 'vitest'
import { scheduleSummary } from './professionalSchedule'

it('groups only consecutive days with the same full set of periods', () => {
  const intervals = ['MONDAY', 'TUESDAY', 'WEDNESDAY'].flatMap((diaSemana) => [
    { diaSemana, inicio: '09:00:00', fim: '12:00:00' },
    { diaSemana, inicio: '14:00:00', fim: '18:00:00' },
  ])
  intervals.push({ diaSemana: 'FRIDAY', inicio: '09:00:00', fim: '18:00:00' })

  expect(scheduleSummary(intervals)).toEqual([
    'Seg–Qua · 09:00–12:00 e 14:00–18:00',
    'Sex · 09:00–18:00',
  ])
})
