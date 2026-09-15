import { AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios'
import { describe, expect, it } from 'vitest'
import { normalizeAuthError } from './authErrorMessage'

function httpError(status: number, data: unknown) {
  const config = {} as InternalAxiosRequestConfig
  const response = {
    status,
    statusText: '',
    headers: {},
    config,
    data,
  } as AxiosResponse

  return new AxiosError('Request failed', undefined, config, undefined, response)
}

describe('normalizeAuthError', () => {
  it('normalizes invalid credentials from a ProblemDetail response', () => {
    const result = normalizeAuthError(
      httpError(401, {
        status: 401,
        title: 'Unauthorized',
        detail: 'E-mail ou senha inválidos.',
        code: 'INVALID_CREDENTIALS',
      }),
    )

    expect(result).toEqual({
      status: 401,
      message: 'E-mail ou senha inválidos.',
      code: 'INVALID_CREDENTIALS',
    })
  })

  it('normalizes duplicate e-mail failures using an API message', () => {
    const result = normalizeAuthError(
      httpError(409, {
        message: 'Este e-mail já está cadastrado.',
        code: 'EMAIL_ALREADY_EXISTS',
      }),
    )

    expect(result).toEqual({
      status: 409,
      message: 'Este e-mail já está cadastrado.',
      code: 'EMAIL_ALREADY_EXISTS',
    })
  })

  it('uses a stable message for generic failures', () => {
    expect(normalizeAuthError(new Error('socket closed'))).toEqual({
      message: 'Não foi possível concluir a solicitação. Tente novamente.',
    })
  })

  it('ignores non-string API error fields', () => {
    expect(
      normalizeAuthError(
        httpError(400, {
          detail: { reason: 'invalid' },
          message: 42,
          title: 'Bad Request',
          code: 400_001,
        }),
      ),
    ).toEqual({
      status: 400,
      message: 'Bad Request',
    })
  })
})
