import axios from 'axios'
import { normalizeAuthError } from '../../features/auth/utils/authErrorMessage'
import { authStore } from '../../store/authStore'

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api',
})

apiClient.interceptors.request.use((config) => {
  const token = authStore.getState().token

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    const apiError = normalizeAuthError(error)

    if (apiError.status === 401) {
      authStore.getState().clearSession()
    }

    return Promise.reject(apiError)
  },
)
