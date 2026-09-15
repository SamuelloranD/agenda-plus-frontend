export type UserRole = 'ADMIN' | 'CLIENTE'

export interface LoginInput {
  email: string
  senha: string
}

export interface RegisterInput {
  nome: string
  email: string
  senha: string
}

export interface AuthToken {
  token: string
  tokenType: string
  expiresIn: number
}

export interface User {
  id: string
  nome: string
  email: string
  role: UserRole
}
