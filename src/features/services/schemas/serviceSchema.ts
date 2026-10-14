import { z } from 'zod'

export const serviceSchema = z.object({
  nome: z.string().trim().min(1, 'Informe o nome do serviço.').max(150, 'O nome deve ter no máximo 150 caracteres.'),
  descricao: z.string().trim().max(500, 'A descrição deve ter no máximo 500 caracteres.'),
  duracaoMinutos: z.number().int('Informe uma duração inteira.').positive('A duração deve ser maior que zero.'),
  preco: z.object({
    valor: z.number().nonnegative('O preço não pode ser negativo.'),
    moeda: z.literal('BRL'),
  }),
  ativo: z.boolean(),
})

export type ServiceFormValues = z.infer<typeof serviceSchema>
export type ServiceFormInput = z.input<typeof serviceSchema>
