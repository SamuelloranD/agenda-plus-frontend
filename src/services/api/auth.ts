import type { AuthToken, LoginInput, RegisterInput, User } from '../../types/auth'
import { apiClient } from './client'

export const authApi = {
  async login(input: LoginInput): Promise<AuthToken> {
    const { data } = await apiClient.post<AuthToken>('/auth/login', input)
    return data
  },

  async registerClient(input: RegisterInput): Promise<User> {
    const { data } = await apiClient.post<User>('/auth/cadastro', input)
    return data
  },

  async registerBusiness(input: RegisterInput): Promise<User> {
    const { data } = await apiClient.post<User>('/auth/cadastro-negocio', input)
    return data
  },

  async me(): Promise<User> {
    const { data } = await apiClient.get<User>('/identity/me')
    return data
  },
}
