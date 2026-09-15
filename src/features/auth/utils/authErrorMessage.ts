import axios from 'axios'
import type { ApiError, ProblemDetail } from '../../../types/api'

const GENERIC_ERROR_MESSAGE = 'Não foi possível concluir a solicitação. Tente novamente.'

function isProblemDetail(value: unknown): value is ProblemDetail {
  return typeof value === 'object' && value !== null
}

export function normalizeAuthError(error: unknown): ApiError {
  if (!axios.isAxiosError(error)) {
    return { message: GENERIC_ERROR_MESSAGE }
  }

  const data = error.response?.data
  const problem = isProblemDetail(data) ? data : undefined
  const status = error.response?.status ?? problem?.status
  const message = problem?.detail || problem?.message || problem?.title || GENERIC_ERROR_MESSAGE

  return {
    ...(status === undefined ? {} : { status }),
    message,
    ...(problem?.code ? { code: problem.code } : {}),
  }
}
