interface MetricCardProps {
  label: string
  value: number
  tone: 'terracotta' | 'olive' | 'mustard' | 'muted'
  note: string
}

export function MetricCard({ label, value, tone, note }: MetricCardProps) {
  return (
    <article className={`metric-card metric-card--${tone}`}>
      <p>{label}</p>
      <strong>{String(value).padStart(2, '0')}</strong>
      <span>{note}</span>
    </article>
  )
}
