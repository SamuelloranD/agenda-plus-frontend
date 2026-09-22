export type ProfessionalTone = 'clay' | 'sage' | 'ochre' | 'rose' | 'forest' | 'sand' | 'rust' | 'moss' | 'wheat'

const tones: ProfessionalTone[] = ['clay', 'sage', 'ochre', 'rose', 'forest', 'sand', 'rust', 'moss', 'wheat']
export const professionalToneColors: Record<ProfessionalTone, string> = {
  clay: '#9d5c43', sage: '#71836c', ochre: '#b18432', rose: '#a96b68', forest: '#4d6855', sand: '#9a8061', rust: '#a95f46', moss: '#667354', wheat: '#b79a62',
}

export function getProfessionalTone(professionalId: string): ProfessionalTone {
  let hash = 0
  for (const character of professionalId) {
    hash = (hash * 31 + character.codePointAt(0)!) % tones.length
  }
  return tones[hash]
}
