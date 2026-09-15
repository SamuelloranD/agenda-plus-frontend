import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { StatusBadge } from './StatusBadge'
import { agendamentosQueryKey } from '../../features/scheduling/hooks/useAgendamentos'
import type { AgendamentoStatus } from '../../types/scheduling'

describe('StatusBadge', () => {
  const statusCases: Array<[AgendamentoStatus, string, string]> = [
    ['PENDENTE', 'mustard', 'mustard'],
    ['CONFIRMADO', 'olive', 'olive'],
    ['CANCELADO', 'terracotta', 'terracotta'],
    ['CONCLUIDO', 'muted', 'line'],
  ]

  it.each(statusCases)('maps %s to the %s visual token', (status, token, cssToken) => {
    render(<StatusBadge status={status} />)

    const badge = screen.getByText(status)
    expect(badge).toHaveAttribute('data-status-token', token)
    expect(badge).toHaveClass(`status-badge--${token}`)
    expect(badge).toHaveStyle({ backgroundColor: `var(--${cssToken})` })
  })
})

it('keeps the backend status contract explicit', () => {
  const supportedStatus: import('../../types/scheduling').AgendamentoStatus = 'PENDENTE'
  expect(supportedStatus).toBe('PENDENTE')
  // @ts-expect-error Unsupported backend statuses must not be accepted by the domain type.
  const unsupportedStatus: import('../../types/scheduling').AgendamentoStatus = 'UNKNOWN'
  expect(unsupportedStatus).toBe('UNKNOWN')
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
