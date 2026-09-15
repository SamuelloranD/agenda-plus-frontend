interface LoadingStateProps {
  message?: string
}

export function LoadingState({ message = 'Carregando…' }: LoadingStateProps) {
  return <p className="ui-state" role="status">{message}</p>
}
