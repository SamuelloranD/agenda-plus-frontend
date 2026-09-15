import { describe, expect, it } from 'vitest'
import { loginSchema } from './authSchemas'

describe('loginSchema', () => {
  it.each([
    { email: '', senha: 'segredo123' },
    { email: '   ', senha: 'segredo123' },
    { email: 'cliente@agenda.plus', senha: '' },
    { email: 'cliente@agenda.plus', senha: '   ' },
  ])('rejects blank credentials: $email / $senha', (input) => {
    expect(loginSchema.safeParse(input).success).toBe(false)
  })

  it('accepts valid login credentials', () => {
    expect(
      loginSchema.safeParse({
        email: 'cliente@agenda.plus',
        senha: 'segredo123',
      }),
    ).toMatchObject({
      success: true,
      data: {
        email: 'cliente@agenda.plus',
        senha: 'segredo123',
      },
    })
  })

  it('preserves leading and trailing spaces in a nonblank password', () => {
    const result = loginSchema.parse({
      email: 'cliente@agenda.plus',
      senha: ' segredo com espaços ',
    })

    expect(result.senha).toBe(' segredo com espaços ')
  })
})
