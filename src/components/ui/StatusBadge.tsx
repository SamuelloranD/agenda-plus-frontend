import type { AgendamentoStatus } from '../../types/scheduling'

type StatusToken = 'mustard' | 'olive' | 'terracotta' | 'muted'
const statusTokens: Record<string, StatusToken> = { PENDENTE: 'mustard', CONFIRMADO: 'olive', CANCELADO: 'terracotta', CONCLUIDO: 'muted' }
const statusStyles: Record<StatusToken, React.CSSProperties> = {
  mustard: { color: 'var(--ink)', backgroundColor: 'var(--mustard)', borderColor: 'var(--mustard)' },
  olive: { color: 'var(--paper)', backgroundColor: 'var(--olive)', borderColor: 'var(--olive)' },
  terracotta: { color: 'var(--paper)', backgroundColor: 'var(--terracotta)', borderColor: 'var(--terracotta)' },
  muted: { color: 'var(--muted-ink)', backgroundColor: 'var(--line)', borderColor: 'var(--line)' },
}

function getStatusToken(status: AgendamentoStatus): StatusToken { return statusTokens[status.toUpperCase()] ?? 'muted' }

export function StatusBadge({ status }: { status: AgendamentoStatus }) {
  const token = getStatusToken(status)
  return <span className={`status-badge status-badge--${token}`} data-status-token={token} style={{ ...statusStyles[token], display: 'inline-flex', alignItems: 'center', padding: '4px 9px', border: '1px solid', borderRadius: '999px', fontSize: '11px', fontWeight: 700 }}>{status}</span>
}
