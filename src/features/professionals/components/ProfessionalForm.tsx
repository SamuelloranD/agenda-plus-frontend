import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { Controller, useFieldArray, useForm } from 'react-hook-form'
import type { ApiError } from '../../../types/api'
import { Select } from '../../../components/ui/Select'
import type { ProfissionalResponse } from '../../../types/professionals'
import { useCreateProfessional, useUpdateProfessional } from '../hooks/useProfessionals'
import { professionalSchema, weekdays, type ProfessionalFormValues } from '../schemas/professionalSchema'

interface ProfessionalFormProps {
  professional?: ProfissionalResponse | null
  onDone: () => void
}

const weekdayLabels: Record<(typeof weekdays)[number], string> = {
  MONDAY: 'Segunda-feira', TUESDAY: 'Terça-feira', WEDNESDAY: 'Quarta-feira', THURSDAY: 'Quinta-feira', FRIDAY: 'Sexta-feira', SATURDAY: 'Sábado', SUNDAY: 'Domingo',
}

function emptyValues(): ProfessionalFormValues {
  return { nome: '', especialidade: '', horariosTrabalho: [{ diaSemana: 'MONDAY', inicio: '09:00', fim: '18:00' }] }
}

export function ProfessionalForm({ professional, onDone }: ProfessionalFormProps) {
  const form = useForm<ProfessionalFormValues>({ resolver: zodResolver(professionalSchema), defaultValues: emptyValues() })
  const intervals = useFieldArray({ control: form.control, name: 'horariosTrabalho' })
  const createProfessional = useCreateProfessional()
  const updateProfessional = useUpdateProfessional()

  useEffect(() => {
    form.reset(professional ? { nome: professional.nome, especialidade: professional.especialidade, horariosTrabalho: professional.horariosTrabalho.map(({ diaSemana, inicio, fim }) => ({ diaSemana: diaSemana as (typeof weekdays)[number], inicio, fim })) } : emptyValues())
  }, [professional, form])

  const submit = (values: ProfessionalFormValues) => {
    if (professional) updateProfessional.mutate({ id: professional.id, input: values }, { onSuccess: onDone })
    else createProfessional.mutate(values, { onSuccess: onDone })
  }
  const isPending = createProfessional.isPending || updateProfessional.isPending
  const error = (createProfessional.error ?? updateProfessional.error) as ApiError | null

  return (
    <form className="catalog-form" onSubmit={form.handleSubmit(submit)} noValidate>
      <header><p className="section-label">{professional ? 'Ajustar cadastro' : 'Novo cadastro'}</p><h3>{professional ? professional.nome : 'Adicionar profissional'}</h3></header>
      <label className="catalog-field">Nome
        <input {...form.register('nome')} placeholder="Nome completo" aria-invalid={Boolean(form.formState.errors.nome)} />
        {form.formState.errors.nome && <small>{form.formState.errors.nome.message}</small>}
      </label>
      <label className="catalog-field">Especialidade
        <input {...form.register('especialidade')} placeholder="Ex.: Barbeiro, manicure, estética" aria-invalid={Boolean(form.formState.errors.especialidade)} />
        {form.formState.errors.especialidade && <small>{form.formState.errors.especialidade.message}</small>}
      </label>
      <section className="work-hours" aria-labelledby="work-hours-title">
        <div className="work-hours__heading"><div><p className="section-label">Disponibilidade</p><h4 id="work-hours-title">Jornada de trabalho</h4></div><button type="button" className="quiet-action" onClick={() => intervals.append({ diaSemana: 'MONDAY', inicio: '09:00', fim: '18:00' })}>+ Adicionar faixa</button></div>
        {intervals.fields.map((field, index) => <div className="interval-row" key={field.id}>
          <label>Dia<Controller control={form.control} name={`horariosTrabalho.${index}.diaSemana`} render={({ field }) => <Select id={`professional-weekday-${index}`} value={field.value} onChange={field.onChange} onBlur={field.onBlur} options={weekdays.map((weekday) => ({ value: weekday, label: weekdayLabels[weekday] }))} />} /></label>
          <label>Início<input type="time" {...form.register(`horariosTrabalho.${index}.inicio`)} /></label>
          <label>Fim<input type="time" {...form.register(`horariosTrabalho.${index}.fim`)} /></label>
          <button type="button" className="remove-action" onClick={() => intervals.remove(index)} disabled={intervals.fields.length === 1} aria-label="Remover faixa de horário">×</button>
          {form.formState.errors.horariosTrabalho?.[index]?.fim && <small className="interval-error">{form.formState.errors.horariosTrabalho[index]?.fim?.message}</small>}
        </div>)}
        {form.formState.errors.horariosTrabalho?.message && <small className="field-error">{form.formState.errors.horariosTrabalho.message}</small>}
      </section>
      {error && <p className="form-error" role="alert">{error.message ?? 'Não foi possível salvar o profissional.'}</p>}
      <footer className="catalog-form__footer"><button type="button" className="quiet-action" onClick={onDone}>Cancelar</button><button type="submit" className="primary-action" disabled={isPending}>{isPending ? 'Salvando…' : professional ? 'Salvar alterações' : 'Cadastrar profissional'}</button></footer>
    </form>
  )
}
