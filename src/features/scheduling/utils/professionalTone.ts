export type ProfessionalTone = 'slate' | 'indigo' | 'teal' | 'denim' | 'plum' | 'petrol' | 'stone' | 'bluegray' | 'lilac'

const tones: ProfessionalTone[] = ['slate', 'indigo', 'teal', 'denim', 'plum', 'petrol', 'stone', 'bluegray', 'lilac']
export const professionalToneColors: Record<ProfessionalTone, string> = {
  slate: '#58677a', indigo: '#665b86', teal: '#3e7773', denim: '#4f6f89', plum: '#76566f', petrol: '#356b6b', stone: '#81786e', bluegray: '#465b6f', lilac: '#877998',
}

export function getProfessionalTone(professionalId: string): ProfessionalTone {
  let hash = 0
  for (const character of professionalId) {
    hash = (hash * 31 + character.codePointAt(0)!) % tones.length
  }
  return tones[hash]
}
