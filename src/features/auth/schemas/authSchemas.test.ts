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
})
