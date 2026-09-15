import { create } from 'zustand'
import type { User } from '../types/auth'

const TOKEN_STORAGE_KEY = 'agenda-plus:auth-token'

function readStoredToken() {
  if (typeof localStorage === 'undefined') {
    return null
  }

  return localStorage.getItem(TOKEN_STORAGE_KEY)
}

interface AuthState {
  token: string | null
  user: User | null
  setSession: (token: string, user: User | null) => void
  clearSession: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  token: readStoredToken(),
  user: null,
  setSession: (token, user) => {
    localStorage.setItem(TOKEN_STORAGE_KEY, token)
    set({ token, user })
  },
  clearSession: () => {
    localStorage.removeItem(TOKEN_STORAGE_KEY)
    set({ token: null, user: null })
  },
}))

export const authStore = useAuthStore
