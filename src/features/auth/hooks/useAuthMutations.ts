import { useMutation, useQueryClient, type QueryClient } from '@tanstack/react-query'
import { authApi } from '../../../services/api/auth'
import { authStore } from '../../../store/authStore'
import type { LoginInput, RegisterInput, User } from '../../../types/auth'

export type RegistrationMode = 'client' | 'business'

export function getPendingReturnPath(search: string) {
  const returnTo = new URLSearchParams(search).get('returnTo')
  return returnTo === '/meus-agendamentos' || returnTo === '/agendar' || returnTo?.startsWith('/agendar/') ? returnTo : null
}

export class RegistrationSessionError extends Error {
  readonly accountCreated = true

  constructor(cause: unknown) {
    super('Account created, but automatic sign-in failed.', { cause })
    this.name = 'RegistrationSessionError'
  }
}

const SESSION_QUERY_KEY = ['auth', 'session'] as const

async function openSession(credentials: LoginInput, queryClient: QueryClient): Promise<User> {
  const { token } = await authApi.login(credentials)
  authStore.getState().setSession(token, null)

  try {
    const user = await queryClient.fetchQuery({
      queryKey: SESSION_QUERY_KEY,
      queryFn: authApi.me,
    })
    authStore.getState().setSession(token, user)
    return user
  } catch (error) {
    authStore.getState().clearSession()
    throw error
  }
}

export function useLoginMutation() {
  const queryClient = useQueryClient()
  return useMutation({ mutationFn: (input: LoginInput) => openSession(input, queryClient) })
}

export function useRegisterMutation(mode: RegistrationMode) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: RegisterInput) => {
      if (mode === 'client') {
        await authApi.registerClient(input)
      } else {
        await authApi.registerBusiness(input)
      }

      try {
        return await openSession({ email: input.email, senha: input.senha }, queryClient)
      } catch (error) {
        throw new RegistrationSessionError(error)
      }
    },
  })
}
