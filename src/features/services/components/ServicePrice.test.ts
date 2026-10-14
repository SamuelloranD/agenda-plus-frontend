import { describe, expect, it } from 'vitest'
import { parseBrazilianPrice } from './ServiceForm'

describe('preço em reais', () => {
  it('converte vírgula decimal e ponto de milhar sem perder centavos', () => {
    expect(parseBrazilianPrice('1.234,56')).toBe(1234.56)
    expect(parseBrazilianPrice('0,01')).toBe(0.01)
    expect(parseBrazilianPrice('0')).toBe(0)
  })
  it('rejeita entrada vazia, decimal ambíguo ou mais de dois centavos', () => {
    for (const text of ['', '60.00', '12,345', '-1', '90071992547410,00']) expect(Number.isNaN(parseBrazilianPrice(text))).toBe(true)
  })
})
