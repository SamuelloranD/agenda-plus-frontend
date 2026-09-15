interface EmptyStateProps {
  message?: string
  onAction?: () => void
  actionLabel?: string
}

export function EmptyState({ message = 'Nada por aqui ainda.', onAction, actionLabel = 'Começar' }: EmptyStateProps) {
  return (
    <div className="ui-state">
      <p>{message}</p>
      {onAction && <button type="button" onClick={onAction}>{actionLabel}</button>}
    </div>
  )
}
