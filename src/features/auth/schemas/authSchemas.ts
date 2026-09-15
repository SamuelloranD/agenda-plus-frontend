import { z } from 'zod'
import type { LoginInput, RegisterInput } from '../../../types/auth'

const emailSchema = z.string().trim().min(1, 'Informe o e-mail.').email('Informe um e-mail válido.')
const passwordSchema = z.string().refine((password) => password.trim().length > 0, 'Informe a senha.')

export const loginSchema: z.ZodType<LoginInput> = z.object({
  email: emailSchema,
  senha: passwordSchema,
})

export const registerSchema: z.ZodType<RegisterInput> = z.object({
  nome: z.string().trim().min(1, 'Informe o nome.'),
  email: emailSchema,
  senha: passwordSchema,
})
