import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import type { ApiError } from '../../../types/api'
import { useClients } from '../../clients/hooks/useClients'
import { useProfessionals } from '../../professionals/hooks/useProfessionals'
import { useServices } from '../../services/hooks/useServices'
import { useCreateAgendamento } from '../hooks/useCreateAgendamento'
import { useHorariosDisponiveis } from '../hooks/useHorariosDisponiveis'
import { agendamentoSchema, type AgendamentoFormValues } from '../schemas/agendamentoSchema'

interface NewAppointmentFormProps {
  onSuccess: () => void
}

function todayKey() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

function appointmentErrorMessage(error: unknown) {
  const apiError = error as ApiError
  if (apiError.status === 409) return 'Este horário acabou de ser reservado. Escolha outro horário disponível.'
  return apiError.message ?? 'Não foi possível criar o agendamento. Tente novamente.'
}

export function NewAppointmentForm({ onSuccess }: NewAppointmentFormProps) {
  const [data, setData] = useState(todayKey)
  const clientsQuery = useClients()
  const professionalsQuery = useProfessionals()
  const servicesQuery = useServices()
  const createAppointment = useCreateAgendamento()
  const form = useForm<AgendamentoFormValues>({
    resolver: zodResolver(agendamentoSchema),
    defaultValues: { inicio: '', fim: '', profissionalId: '', clienteId: '', servicoId: '' },
  })
  const profissionalId = useWatch({ control: form.control, name: 'profissionalId' })
  const servicoId = useWatch({ control: form.control, name: 'servicoId' })
  const horariosQuery = useHorariosDisponiveis({ profissionalId, servicoId, data })

  useEffect(() => {
    form.setValue('inicio', '')
    form.setValue('fim', '')
  }, [data, profissionalId, servicoId, form])

  const isLoadingCatalog = clientsQuery.isLoading || professionalsQuery.isLoading || servicesQuery.isLoading
  const catalogError = clientsQuery.isError || professionalsQuery.isError || servicesQuery.isError
  const selectedStart = useWatch({ control: form.control, name: 'inicio' })

  if (isLoadingCatalog) return <p className="form-state" role="status">Abrindo os registros do ateliê…</p>
  if (catalogError) return <p className="form-state form-state--error" role="alert">Não foi possível abrir os dados necessários para este agendamento.</p>

  const clients = (clientsQuery.data ?? []).filter((client) => client.role === 'CLIENTE')
  const professionals = professionalsQuery.data ?? []
  const services = servicesQuery.data ?? []

  return (
    <form className="appointment-form" onSubmit={form.handleSubmit((values) => createAppointment.mutate(values, { onSuccess }))} noValidate>
      <input type="hidden" {...form.register('inicio')} />
      <input type="hidden" {...form.register('fim')} />

      <fieldset className="appointment-step">
        <legend><span>1</span> Cliente do ateliê</legend>
        <label className="form-field">Cliente
          <select {...form.register('clienteId')} aria-invalid={Boolean(form.formState.errors.clienteId)}>
            <option value="">Selecione quem receberá o atendimento</option>
            {clients.map((client) => <option key={client.id} value={client.id}>{client.nome} · {client.email}</option>)}
          </select>
          {form.formState.errors.clienteId && <small>{form.formState.errors.clienteId.message}</small>}
        </label>
      </fieldset>

      <fieldset className="appointment-step">
        <legend><span>2</span> Serviço e profissional</legend>
        <div className="form-columns">
          <label className="form-field">Serviço
            <select {...form.register('servicoId')} aria-invalid={Boolean(form.formState.errors.servicoId)}>
              <option value="">Selecione o serviço</option>
              {services.map((service) => <option key={service.id} value={service.id}>{service.nome} · {service.duracaoMinutos} min</option>)}
            </select>
            {form.formState.errors.servicoId && <small>{form.formState.errors.servicoId.message}</small>}
          </label>
          <label className="form-field">Profissional
            <select {...form.register('profissionalId')} aria-invalid={Boolean(form.formState.errors.profissionalId)}>
              <option value="">Selecione o profissional</option>
              {professionals.map((professional) => <option key={professional.id} value={professional.id}>{professional.nome} · {professional.especialidade}</option>)}
            </select>
            {form.formState.errors.profissionalId && <small>{form.formState.errors.profissionalId.message}</small>}
          </label>
        </div>
      </fieldset>

      <fieldset className="appointment-step">
        <legend><span>3</span> Data e horário</legend>
        <label className="form-field form-field--date">Data do atendimento
          <input type="date" value={data} min={todayKey()} onChange={(event) => setData(event.target.value)} />
        </label>
        {!profissionalId || !servicoId ? <p className="form-hint">Escolha o serviço e o profissional para consultar os horários livres.</p> : null}
        {horariosQuery.isLoading && <p className="form-hint" role="status">Consultando a agenda disponível…</p>}
        {horariosQuery.isError && <p className="form-hint form-hint--error" role="alert">Não foi possível consultar os horários. Tente escolher outra data.</p>}
        {horariosQuery.data && horariosQuery.data.length === 0 && <p className="form-hint">Não há horários livres nesta data. Escolha outro dia.</p>}
        {horariosQuery.data && horariosQuery.data.length > 0 && (
          <div className="availability-list" aria-label="Horários disponíveis">
            {horariosQuery.data.map((slot) => {
              const isSelected = selectedStart === slot.inicio
              return <button className={isSelected ? 'time-option time-option--selected' : 'time-option'} type="button" key={slot.inicio} onClick={() => {
                form.setValue('inicio', slot.inicio, { shouldValidate: true })
                form.setValue('fim', slot.fim, { shouldValidate: true })
              }}>{slot.inicio.slice(11, 16)} <small>até {slot.fim.slice(11, 16)}</small></button>
            })}
          </div>
        )}
        {(form.formState.errors.inicio || form.formState.errors.fim) && <small className="field-error">{form.formState.errors.inicio?.message ?? form.formState.errors.fim?.message}</small>}
      </fieldset>

      {createAppointment.isError && <p className="form-error" role="alert">{appointmentErrorMessage(createAppointment.error)}</p>}
      <footer className="appointment-submit-row">
        <p>O agendamento será registrado como pendente.</p>
        <button className="primary-action" type="submit" disabled={createAppointment.isPending}>{createAppointment.isPending ? 'Registrando…' : 'Confirmar agendamento'}</button>
      </footer>
    </form>
  )
}
