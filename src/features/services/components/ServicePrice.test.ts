import { describe, expect, it } from 'vitest'
import { formatBrazilianPriceInput, parseBrazilianPrice } from '../utils/servicePrice'

describe('preço em reais', () => {
  it('desloca os dígitos dos centavos para os milhares enquanto o usuário digita', () => {
    expect(formatBrazilianPriceInput('')).toBe('')
    expect(formatBrazilianPriceInput('1')).toBe('0,01')
    expect(formatBrazilianPriceInput('12')).toBe('0,12')
    expect(formatBrazilianPriceInput('123')).toBe('1,23')
    expect(formatBrazilianPriceInput('123456')).toBe('1.234,56')
    expect(formatBrazilianPriceInput('R$ 1.234,56')).toBe('1.234,56')
    expect(formatBrazilianPriceInput('0,01a')).toBe('0,01')
  })
  it('converte vírgula decimal e ponto de milhar sem perder centavos', () => {
    expect(parseBrazilianPrice('1.234,56')).toBe(1234.56)
    expect(parseBrazilianPrice('0,01')).toBe(0.01)
    expect(parseBrazilianPrice('0')).toBe(0)
  })
  it('rejeita entrada vazia, decimal ambíguo ou mais de dois centavos', () => {
    for (const text of ['', '60.00', '12,345', '-1', '90071992547410,00']) expect(Number.isNaN(parseBrazilianPrice(text))).toBe(true)
  })
})
