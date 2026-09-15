import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'

export interface AdminSession {
  role: string
}

interface ProtectedRouteProps {
  children: ReactNode
  session?: AdminSession | null
}

export function ProtectedRoute({ children, session }: ProtectedRouteProps) {
  if (session?.role !== 'ADMIN') {
    return <Navigate to="/login" replace />
  }

  return children
}
