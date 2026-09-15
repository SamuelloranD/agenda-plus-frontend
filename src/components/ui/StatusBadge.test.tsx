import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { StatusBadge } from './StatusBadge'
import { agendamentosQueryKey } from '../../features/scheduling/hooks/useAgendamentos'

describe('StatusBadge', () => {
  it.each([
    ['PENDENTE', 'mustard'],
    ['CONFIRMADO', 'olive'],
    ['CANCELADO', 'terracotta'],
    ['CONCLUIDO', 'muted'],
  ])('maps %s to the %s visual token', (status, token) => {
    render(<StatusBadge status={status} />)

    expect(screen.getByText(status)).toHaveAttribute('data-status-token', token)
  })
})

describe('agendamentos query key', () => {
  it('shares one stable key for equivalent date ranges', () => {
    expect(
      agendamentosQueryKey({ dataInicio: '2026-09-15', dataFim: '2026-09-21' }),
    ).toEqual(agendamentosQueryKey({ dataInicio: '2026-09-15', dataFim: '2026-09-21' }))
  })

  it('separates distinct filters', () => {
    expect(
      agendamentosQueryKey({ dataInicio: '2026-09-15', dataFim: '2026-09-21', profissionalId: 'one' }),
    ).not.toEqual(
      agendamentosQueryKey({ dataInicio: '2026-09-15', dataFim: '2026-09-21', profissionalId: 'two' }),
    )
  })
})
