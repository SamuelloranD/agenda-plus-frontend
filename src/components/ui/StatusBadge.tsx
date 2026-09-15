import type { AgendamentoStatus } from '../../types/scheduling'

type StatusToken = 'mustard' | 'olive' | 'terracotta' | 'muted'
const statusTokens: Record<string, StatusToken> = { PENDENTE: 'mustard', CONFIRMADO: 'olive', CANCELADO: 'terracotta', CONCLUIDO: 'muted' }

function getStatusToken(status: AgendamentoStatus): StatusToken { return statusTokens[status.toUpperCase()] ?? 'muted' }

export function StatusBadge({ status }: { status: AgendamentoStatus }) {
  return <span data-status-token={getStatusToken(status)}>{status}</span>
}
