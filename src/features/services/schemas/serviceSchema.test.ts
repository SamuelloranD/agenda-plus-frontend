import { describe, expect, it } from 'vitest'
import { serviceSchema } from './serviceSchema'

const validService = {
  nome: 'Corte Clássico',
  duracaoMinutos: 45,
  preco: { valor: 85, moeda: 'BRL' },
}

describe('serviceSchema', () => {
  it('accepts a service with a positive duration and price', () => {
    expect(serviceSchema.safeParse(validService).success).toBe(true)
  })

  it.each([0, -1])('rejects an invalid duration of %s minutes', (duracaoMinutos) => {
    expect(serviceSchema.safeParse({ ...validService, duracaoMinutos }).success).toBe(false)
  })

  it.each([0, -10])('rejects an invalid price of %s', (valor) => {
    expect(serviceSchema.safeParse({ ...validService, preco: { ...validService.preco, valor } }).success).toBe(false)
  })

  it('rejects a blank service name or currency', () => {
    expect(serviceSchema.safeParse({ ...validService, nome: '  ' }).success).toBe(false)
    expect(serviceSchema.safeParse({ ...validService, preco: { ...validService.preco, moeda: '  ' } }).success).toBe(false)
  })
})
