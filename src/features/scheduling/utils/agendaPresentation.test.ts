import { describe, expect, it } from 'vitest'
import { formatAgendaStatus, eventDensityClass } from './agendaPresentation'

describe('agenda presentation helpers', () => {
  it('uses readable status labels in the agenda views', () => {
    expect(formatAgendaStatus('PENDENTE')).toBe('Aguardando confirmação')
    expect(formatAgendaStatus('CONFIRMADO')).toBe('Confirmado')
  })

  it('keeps short events identifiable without pretending they last longer', () => {
    expect(eventDensityClass(15)).toBe('short')
    expect(eventDensityClass(30)).toBe('standard')
  })
})
