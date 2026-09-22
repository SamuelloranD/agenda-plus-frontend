import { describe, expect, it } from 'vitest'
import { getProfessionalTone } from './professionalTone'

describe('getProfessionalTone', () => {
  it('returns the same curated tone for the same professional ID', () => {
    expect(getProfessionalTone('professional-1')).toBe(getProfessionalTone('professional-1'))
  })

  it('keeps tones within the curated visual palette', () => {
    const tones = new Set(['clay', 'sage', 'ochre', 'rose', 'forest', 'sand', 'rust', 'moss', 'wheat'])
    expect(tones.has(getProfessionalTone('professional-42'))).toBe(true)
  })
})
