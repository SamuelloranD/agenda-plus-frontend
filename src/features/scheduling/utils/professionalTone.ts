export type ProfessionalTone = 'terracotta' | 'olive' | 'mustard'

const tones: ProfessionalTone[] = ['terracotta', 'olive', 'mustard']

export function getProfessionalTone(professionalId: string): ProfessionalTone {
  let hash = 0
  for (const character of professionalId) {
    hash = (hash * 31 + character.codePointAt(0)!) % tones.length
  }
  return tones[hash]
}
