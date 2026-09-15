import axios from 'axios'
import type { ApiError } from '../../../types/api'

const GENERIC_ERROR_MESSAGE = 'Não foi possível concluir a solicitação. Tente novamente.'

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function nonEmptyString(value: unknown) {
  return typeof value === 'string' && value.length > 0 ? value : undefined
}

export function normalizeAuthError(error: unknown): ApiError {
  if (!axios.isAxiosError(error)) {
    return { message: GENERIC_ERROR_MESSAGE }
  }

  const data = error.response?.data
  const problem = isObject(data) ? data : undefined
  const responseStatus = error.response?.status
  const status = typeof responseStatus === 'number'
    ? responseStatus
    : typeof problem?.status === 'number' ? problem.status : undefined
  const message = nonEmptyString(problem?.detail)
    ?? nonEmptyString(problem?.message)
    ?? nonEmptyString(problem?.title)
    ?? GENERIC_ERROR_MESSAGE
  const code = nonEmptyString(problem?.code)

  return {
    ...(status === undefined ? {} : { status }),
    message,
    ...(code ? { code } : {}),
  }
}
