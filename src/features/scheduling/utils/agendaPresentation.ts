import type { AgendamentoStatus } from '../../../types/scheduling'

const statusLabels: Record<AgendamentoStatus, string> = {
  PENDENTE: 'Aguardando confirmação',
  CONFIRMADO: 'Confirmado',
  CANCELADO: 'Cancelado',
  CONCLUIDO: 'Concluído',
}

export function formatAgendaStatus(status: AgendamentoStatus) {
  return statusLabels[status]
}

export function eventDensityClass(durationMinutes: number): 'short' | 'standard' {
  return durationMinutes < 30 ? 'short' : 'standard'
}
