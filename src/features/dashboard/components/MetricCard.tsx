import type { ReactNode } from 'react'

interface MetricCardProps {
  label: string
  value: number | string
  tone: 'terracotta' | 'olive' | 'mustard' | 'neutral'
  note: string
  icon: ReactNode
  action: string
}

export function MetricCard({ label, value, tone, note, icon, action }: MetricCardProps) {
  return <article className={`metric-card metric-card--${tone}`}><span className="metric-card__icon">{icon}</span><div className="metric-card__content"><p>{label}</p><strong>{value}</strong><span>{note}</span><a href="#dashboard-content">{action} <span aria-hidden="true">→</span></a></div></article>
}
