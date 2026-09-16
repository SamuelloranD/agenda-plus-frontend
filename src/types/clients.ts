import type { UserRole } from './auth'

export interface ClienteResponse {
  id: string
  nome: string
  email: string
  role: UserRole
}
