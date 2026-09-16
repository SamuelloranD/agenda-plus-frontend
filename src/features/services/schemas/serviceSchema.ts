import { z } from 'zod'

export const serviceSchema = z.object({
  nome: z.string().trim().min(1, 'Informe o nome do serviço.').max(150, 'O nome deve ter no máximo 150 caracteres.'),
  duracaoMinutos: z.number().int('Informe uma duração inteira.').positive('A duração deve ser maior que zero.'),
  preco: z.object({
    valor: z.number().positive('O preço deve ser maior que zero.'),
    moeda: z.string().trim().min(1, 'Informe a moeda.'),
  }),
})

export type ServiceFormValues = z.infer<typeof serviceSchema>
