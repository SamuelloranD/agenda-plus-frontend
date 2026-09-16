import { z } from 'zod'

const requiredUuid = (message: string) => z.string().uuid(message)

function isValidDateTime(value: string) {
  return !Number.isNaN(new Date(value).getTime())
}

const futureDateTime = z.string().min(1, 'Informe a data e o horário.').refine(isValidDateTime, 'Informe uma data e horário válidos.').refine(
  (value) => new Date(value).getTime() > Date.now(),
  'Escolha um horário futuro.',
)

export const agendamentoSchema = z.object({
  inicio: futureDateTime,
  fim: futureDateTime,
  profissionalId: requiredUuid('Selecione um profissional.'),
  clienteId: requiredUuid('Selecione um cliente.'),
  servicoId: requiredUuid('Selecione um serviço.'),
}).refine((appointment) => new Date(appointment.fim).getTime() > new Date(appointment.inicio).getTime(), {
  message: 'O término deve ser posterior ao início.',
  path: ['fim'],
})

export type AgendamentoFormValues = z.infer<typeof agendamentoSchema>
