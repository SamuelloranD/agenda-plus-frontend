import { describe, expect, it } from 'vitest'
import { agendamentoSchema } from './agendamentoSchema'

const validAppointment = {
  inicio: '2099-10-24T14:00',
  fim: '2099-10-24T14:45',
  profissionalId: '7b27e324-34bf-4d98-950e-2d05eb959c1d',
  clienteId: '2aaf9a2d-3a70-4dc7-842d-50a4021eaee4',
  servicoId: 'b75c12ec-91e1-438d-8e2e-94fdb1698b0c',
}

describe('agendamentoSchema', () => {
  it('accepts a future appointment with concrete catalog IDs', () => {
    expect(agendamentoSchema.safeParse(validAppointment).success).toBe(true)
  })

  it('rejects an appointment whose start is in the past', () => {
    expect(agendamentoSchema.safeParse({ ...validAppointment, inicio: '2020-10-24T14:00', fim: '2020-10-24T14:45' }).success).toBe(false)
  })

  it('rejects an appointment whose end is not after its start', () => {
    expect(agendamentoSchema.safeParse({ ...validAppointment, fim: validAppointment.inicio }).success).toBe(false)
  })

  it.each(['profissionalId', 'clienteId', 'servicoId'] as const)('rejects a missing %s', (field) => {
    expect(agendamentoSchema.safeParse({ ...validAppointment, [field]: '' }).success).toBe(false)
  })
})
