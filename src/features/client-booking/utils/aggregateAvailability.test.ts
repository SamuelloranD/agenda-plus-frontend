import { describe, expect, it } from 'vitest'
import type { ProfissionalResponse } from '../../../types/professionals'
import { aggregateAvailability } from './aggregateAvailability'

const professionals: ProfissionalResponse[] = [
  { id: 'professional-1', nome: 'Ana', especialidade: 'Ceramista', horariosTrabalho: [] },
  { id: 'professional-2', nome: 'Bia', especialidade: 'Massoterapeuta', horariosTrabalho: [] },
]

describe('aggregateAvailability', () => {
  it('merges equal slots while keeping candidates in professional list order', () => {
    const slots = aggregateAvailability(professionals, {
      'professional-1': [
        { inicio: '2026-09-18T10:00:00', fim: '2026-09-18T11:00:00' },
      ],
      'professional-2': [
        { inicio: '2026-09-18T10:00:00', fim: '2026-09-18T11:00:00' },
      ],
    })

    expect(slots).toEqual([
      {
        key: '2026-09-18T10:00:00|2026-09-18T11:00:00',
        inicio: '2026-09-18T10:00:00',
        fim: '2026-09-18T11:00:00',
        candidates: professionals,
      },
    ])
  })

  it('keeps slots with different start or end times separate', () => {
    const slots = aggregateAvailability(professionals, {
      'professional-1': [
        { inicio: '2026-09-18T09:00:00', fim: '2026-09-18T10:00:00' },
      ],
      'professional-2': [
        { inicio: '2026-09-18T09:00:00', fim: '2026-09-18T09:30:00' },
        { inicio: '2026-09-18T11:00:00', fim: '2026-09-18T12:00:00' },
      ],
    })

    expect(slots.map(({ key, candidates }) => ({
      key,
      candidateIds: candidates.map(({ id }) => id),
    }))).toEqual([
      {
        key: '2026-09-18T09:00:00|2026-09-18T10:00:00',
        candidateIds: ['professional-1'],
      },
      {
        key: '2026-09-18T09:00:00|2026-09-18T09:30:00',
        candidateIds: ['professional-2'],
      },
      {
        key: '2026-09-18T11:00:00|2026-09-18T12:00:00',
        candidateIds: ['professional-2'],
      },
    ])
  })

  it('returns no selectable slots when every professional response is empty', () => {
    expect(aggregateAvailability(professionals, {
      'professional-1': [],
      'professional-2': [],
    })).toEqual([])
  })
})
