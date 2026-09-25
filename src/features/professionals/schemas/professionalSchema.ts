import { z } from 'zod'

export const weekdays = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'] as const

const timeSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/, 'Informe um horário válido.')

function timeInMinutes(value: string) {
  const [hours, minutes] = value.split(':').map(Number)
  return hours * 60 + minutes
}

const workIntervalSchema = z.object({
  diaSemana: z.enum(weekdays),
  inicio: timeSchema,
  fim: timeSchema,
}).refine((interval) => timeInMinutes(interval.fim) > timeInMinutes(interval.inicio), {
  message: 'O fim deve ser posterior ao início.',
  path: ['fim'],
})

export const professionalSchema = z.object({
  nome: z.string().trim().min(1, 'Informe o nome.').max(150, 'O nome deve ter no máximo 150 caracteres.'),
  especialidade: z.string().trim().min(1, 'Informe a especialidade.').max(150, 'A especialidade deve ter no máximo 150 caracteres.'),
  horariosTrabalho: z.array(workIntervalSchema).min(1, 'Informe ao menos um horário de trabalho.'),
})

export type ProfessionalFormValues = z.infer<typeof professionalSchema>
