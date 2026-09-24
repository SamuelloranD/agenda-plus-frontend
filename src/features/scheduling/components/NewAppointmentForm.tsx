import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import type { ApiError } from '../../../types/api'
import { DatePicker } from '../../../components/ui/DatePicker'
import { EmptyState } from '../../../components/ui/EmptyState'
import { ErrorState } from '../../../components/ui/ErrorState'
import { LoadingState } from '../../../components/ui/LoadingState'
import { Select } from '../../../components/ui/Select'
import { useClients } from '../../clients/hooks/useClients'
import { useProfessionals } from '../../professionals/hooks/useProfessionals'
import { useServices } from '../../services/hooks/useServices'
import { useCreateAgendamento } from '../hooks/useCreateAgendamento'
import { useHorariosDisponiveis } from '../hooks/useHorariosDisponiveis'
import { agendamentoSchema, type AgendamentoFormValues } from '../schemas/agendamentoSchema'

interface NewAppointmentFormProps {
  onSuccess: () => void
  initialDate?: string
  initialStart?: string
}

function todayKey() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

function dateTimeKey(date: string, start: string) {
  return `${date}T${start}:00`
}

function dateLabel(date: string) {
  const [year, month, day] = date.split('-')
  return `${day}/${month}/${year}`
}

function addMinutes(dateTime: string, minutes: number) {
  const result = new Date(dateTime)
  result.setMinutes(result.getMinutes() + minutes)
  const year = result.getFullYear()
  const month = String(result.getMonth() + 1).padStart(2, '0')
  const day = String(result.getDate()).padStart(2, '0')
  const hours = String(result.getHours()).padStart(2, '0')
  const mins = String(result.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day}T${hours}:${mins}:00`
}

function appointmentErrorMessage(error: unknown) {
  const apiError = error as ApiError
  if (apiError.status === 409) return 'Este horário acabou de ser reservado. Escolha outro horário disponível.'
  return apiError.message ?? 'Não foi possível criar o agendamento. Tente novamente.'
}

function formatMissingCatalogs(catalogs: string[]) {
  if (catalogs.length === 1) return catalogs[0]
  return `${catalogs.slice(0, -1).join(', ')} e ${catalogs.at(-1)}`
}

export function NewAppointmentForm({ onSuccess, initialDate, initialStart }: NewAppointmentFormProps) {
  const presetStart = initialDate && initialStart ? dateTimeKey(initialDate, initialStart) : ''
  const hasFixedDateTime = Boolean(presetStart)
  const [data, setData] = useState(initialDate ?? todayKey)
  const clientsQuery = useClients()
  const professionalsQuery = useProfessionals()
  const servicesQuery = useServices()
  const createAppointment = useCreateAgendamento()
  const form = useForm<AgendamentoFormValues>({
    resolver: zodResolver(agendamentoSchema),
    defaultValues: { inicio: presetStart, fim: '', profissionalId: '', clienteId: '', servicoId: '' },
  })
  const profissionalId = useWatch({ control: form.control, name: 'profissionalId' })
  const servicoId = useWatch({ control: form.control, name: 'servicoId' })
  const horariosQuery = useHorariosDisponiveis({ profissionalId, servicoId, data })
  const selectedStart = useWatch({ control: form.control, name: 'inicio' })
  const selectedEnd = useWatch({ control: form.control, name: 'fim' })
  const selectedService = (servicesQuery.data ?? []).find((service) => service.id === servicoId)

  useEffect(() => {
    form.reset({ inicio: presetStart, fim: '', profissionalId: '', clienteId: '', servicoId: '' })
  }, [form, initialDate, presetStart])

  useEffect(() => {
    const currentStart = form.getValues('inicio')
    const isPresetForSelectedDate = Boolean(presetStart && currentStart === presetStart && data === initialDate)
    if (!isPresetForSelectedDate) {
      form.setValue('inicio', '')
      form.setValue('fim', '')
    }
  }, [data, form, initialDate, presetStart, profissionalId, servicoId])

  useEffect(() => {
    if (!selectedStart || !selectedService) return
    const availableSlot = horariosQuery.data?.find((slot) => slot.inicio === selectedStart)
    const nextEnd = availableSlot?.fim ?? (selectedStart === presetStart ? addMinutes(selectedStart, selectedService.duracaoMinutos) : '')
    form.setValue('fim', nextEnd, { shouldValidate: Boolean(nextEnd) })
  }, [form, horariosQuery.data, presetStart, selectedService, selectedStart])

  const isLoadingCatalog = clientsQuery.isLoading || professionalsQuery.isLoading || servicesQuery.isLoading
  const catalogError = clientsQuery.isError || professionalsQuery.isError || servicesQuery.isError
  function handleSuccessfulCreate() {
    form.reset()
    setData(todayKey())
    onSuccess()
  }

  if (isLoadingCatalog) return <LoadingState message="Abrindo os registros do ateliê…" />
  if (catalogError) return <ErrorState message="Não foi possível abrir os dados necessários para este agendamento." onRetry={() => void Promise.all([clientsQuery.refetch(), professionalsQuery.refetch(), servicesQuery.refetch()])} />

  const clients = (clientsQuery.data ?? []).filter((client) => client.role === 'CLIENTE')
  const professionals = professionalsQuery.data ?? []
  const services = servicesQuery.data ?? []
  const missingCatalogs = [
    clients.length === 0 ? 'um cliente' : null,
    professionals.length === 0 ? 'um profissional' : null,
    services.length === 0 ? 'um serviço' : null,
  ].filter((catalog): catalog is string => catalog !== null)

  if (missingCatalogs.length > 0) {
    return <EmptyState message={`Cadastre ${formatMissingCatalogs(missingCatalogs)} antes de criar um agendamento.`} />
  }

  return (
    <form className="appointment-form" onSubmit={form.handleSubmit((values) => createAppointment.mutate(values, { onSuccess: handleSuccessfulCreate }))} noValidate>
      <input type="hidden" {...form.register('inicio')} />
      <input type="hidden" {...form.register('fim')} />

      <fieldset className="appointment-step">
        <legend><span>1</span> Cliente do ateliê</legend>
        <label className="form-field">Cliente
          <Controller control={form.control} name="clienteId" render={({ field }) => <Select id="appointment-client" value={field.value} onChange={field.onChange} onBlur={field.onBlur} invalid={Boolean(form.formState.errors.clienteId)} options={clients.map((client) => ({ value: client.id, label: `${client.nome} · ${client.email}` }))} placeholder="Selecione quem receberá o atendimento" />} />
          {form.formState.errors.clienteId && <small>{form.formState.errors.clienteId.message}</small>}
        </label>
      </fieldset>

      <fieldset className="appointment-step">
        <legend><span>2</span> Serviço e profissional</legend>
        <div className="form-columns">
          <label className="form-field">Serviço
            <Controller control={form.control} name="servicoId" render={({ field }) => <Select id="appointment-service" value={field.value} onChange={field.onChange} onBlur={field.onBlur} invalid={Boolean(form.formState.errors.servicoId)} options={services.map((service) => ({ value: service.id, label: `${service.nome} · ${service.duracaoMinutos} min` }))} placeholder="Selecione o serviço" />} />
            {form.formState.errors.servicoId && <small>{form.formState.errors.servicoId.message}</small>}
          </label>
          <label className="form-field">Profissional
            <Controller control={form.control} name="profissionalId" render={({ field }) => <Select id="appointment-professional" value={field.value} onChange={field.onChange} onBlur={field.onBlur} invalid={Boolean(form.formState.errors.profissionalId)} options={professionals.map((professional) => ({ value: professional.id, label: `${professional.nome} · ${professional.especialidade}` }))} placeholder="Selecione o profissional" />} />
            {form.formState.errors.profissionalId && <small>{form.formState.errors.profissionalId.message}</small>}
          </label>
        </div>
      </fieldset>

      <fieldset className="appointment-step">
        <legend><span>3</span> Data e horário</legend>
        {hasFixedDateTime ? (
          <div className="appointment-fixed-fields">
            <div className="form-field form-field--date">
              <span>Data do atendimento</span>
              <div className="appointment-fixed-field" aria-label={`Data do atendimento: ${dateLabel(data)}`}>{dateLabel(data)}</div>
            </div>
            <div className="form-field form-field--time">
              <span>Horário</span>
              <div className="appointment-fixed-field" aria-label={`Horário: ${initialStart}`}>{initialStart}</div>
            </div>
          </div>
        ) : (
          <>
            <label className="form-field form-field--date">Data do atendimento
              <DatePicker id="appointment-date" value={data} min={todayKey()} onChange={setData} />
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
            {selectedStart && !horariosQuery.data?.some((slot) => slot.inicio === selectedStart) && (
              <button className="time-option time-option--selected" type="button" onClick={() => form.setValue('inicio', selectedStart, { shouldValidate: true })}>
                {selectedStart.slice(11, 16)} <small>{selectedEnd ? `atÃ© ${selectedEnd.slice(11, 16)}` : 'horÃ¡rio escolhido'}</small>
              </button>
            )}
          </>
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
