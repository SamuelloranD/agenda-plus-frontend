import type { ReactNode } from "react";

interface MetricCardProps {
  label: string;
  value: number | string;
  tone: "terracotta" | "olive" | "mustard" | "neutral";
  note: string;
  icon: ReactNode;
  action: string;
}

export function MetricCard({
  label,
  value,
  tone,
  note,
  icon,
}: MetricCardProps) {
  return (
    <article className={`metric-card metric-card--${tone}`}>
      <span className="metric-card__icon">{icon}</span>
      <div className="metric-card__content">
        <p>{label}</p>
        <strong>{value}</strong>
        <span>{note}</span>
      </div>
    </article>
  );
}
