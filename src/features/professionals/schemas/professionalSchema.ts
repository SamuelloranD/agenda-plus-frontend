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
  imagem: z.string().nullable().default(null),
  nome: z.string().trim().min(1, 'Informe o nome.').max(150, 'O nome deve ter no máximo 150 caracteres.'),
  especialidade: z.string().trim().min(1, 'Informe a especialidade.').max(150, 'A especialidade deve ter no máximo 150 caracteres.'),
  ativo: z.boolean().default(true),
  horariosTrabalho: z.array(workIntervalSchema).superRefine((intervals, context) => {
    weekdays.forEach((day) => {
      const ordered = intervals
        .map((interval, index) => ({ interval, index }))
        .filter(({ interval }) => interval.diaSemana === day)
        .sort((left, right) => left.interval.inicio.localeCompare(right.interval.inicio))
      ordered.forEach((entry, index) => {
        if (index > 0 && entry.interval.inicio < ordered[index - 1].interval.fim) {
          context.addIssue({ code: 'custom', path: [entry.index, 'inicio'], message: 'Este período se sobrepõe a outro no mesmo dia.' })
        }
      })
    })
  }),
})

export type ProfessionalFormValues = z.infer<typeof professionalSchema>
export type ProfessionalFormInput = z.input<typeof professionalSchema>
