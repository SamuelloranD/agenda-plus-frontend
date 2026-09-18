import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'

export interface ClientSession {
  role: string
}

interface ClientRouteProps {
  children: ReactNode
  session?: ClientSession | null
}

export function ClientRoute({ children, session }: ClientRouteProps) {
  if (!session) {
    return <Navigate to="/login?returnTo=/meus-agendamentos" replace />
  }

  if (session.role !== 'CLIENTE') {
    return <Navigate to="/painel" replace />
  }

  return children
}
