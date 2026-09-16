import { describe, expect, it } from 'vitest'
import { professionalSchema } from './professionalSchema'

const validProfessional = {
  nome: 'Mateus Silveira',
  especialidade: 'Barbeiro',
  horariosTrabalho: [{ diaSemana: 'MONDAY', inicio: '09:00', fim: '18:00' }],
}

describe('professionalSchema', () => {
  it('accepts a professional with at least one valid work interval', () => {
    expect(professionalSchema.safeParse(validProfessional).success).toBe(true)
  })

  it('rejects a professional without work intervals', () => {
    expect(professionalSchema.safeParse({ ...validProfessional, horariosTrabalho: [] }).success).toBe(false)
  })

  it('rejects an interval that does not end after it starts', () => {
    expect(professionalSchema.safeParse({ ...validProfessional, horariosTrabalho: [{ diaSemana: 'MONDAY', inicio: '18:00', fim: '18:00' }] }).success).toBe(false)
  })

  it('rejects a work interval with an unsupported weekday', () => {
    expect(professionalSchema.safeParse({ ...validProfessional, horariosTrabalho: [{ diaSemana: 'SEGUNDA', inicio: '09:00', fim: '18:00' }] }).success).toBe(false)
  })
})
