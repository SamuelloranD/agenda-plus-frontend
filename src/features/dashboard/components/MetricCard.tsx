interface MetricCardProps {
  label: string
  value: number | string
  tone: 'terracotta' | 'olive' | 'mustard' | 'muted'
  note: string
}

export function MetricCard({ label, value, tone, note }: MetricCardProps) {
  return (
    <article className={`metric-card metric-card--${tone}`}>
      <p>{label}</p>
      <strong>{value}</strong>
      <span>{note}</span>
    </article>
  )
}
