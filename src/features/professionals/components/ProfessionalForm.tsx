import { zodResolver } from '@hookform/resolvers/zod'
import { Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Controller, useFieldArray, useForm } from 'react-hook-form'
import type { ApiError } from '../../../types/api'
import { Select } from '../../../components/ui/Select'
import { TimePicker } from '../../../components/ui/TimePicker'
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
  const [isAddingInterval, setIsAddingInterval] = useState(false)
  const [selectedDays, setSelectedDays] = useState<(typeof weekdays)[number][]>(['MONDAY'])
  const [newStart, setNewStart] = useState('09:00')
  const [newEnd, setNewEnd] = useState('18:00')
  const createProfessional = useCreateProfessional()
  const updateProfessional = useUpdateProfessional()

  useEffect(() => {
    form.reset(professional ? { nome: professional.nome, especialidade: professional.especialidade, horariosTrabalho: professional.horariosTrabalho.map(({ diaSemana, inicio, fim }) => ({ diaSemana: diaSemana as (typeof weekdays)[number], inicio, fim })) } : emptyValues())
  }, [professional, form])

  function toggleDay(day: (typeof weekdays)[number]) {
    setSelectedDays((current) => current.includes(day) ? current.filter((selected) => selected !== day) : [...current, day])
  }

  function toggleIntervalBuilder() {
    if (!isAddingInterval) {
      const existingDays = new Set(form.getValues('horariosTrabalho').map((interval) => interval.diaSemana))
      setSelectedDays(weekdays.filter((day) => !existingDays.has(day)))
    }
    setIsAddingInterval((current) => !current)
  }

  function addIntervalGroup() {
    const existing = form.getValues('horariosTrabalho')
    const newIntervals = selectedDays
      .filter((day) => !existing.some((interval) => interval.diaSemana === day))
      .map((diaSemana) => ({ diaSemana, inicio: newStart, fim: newEnd }))
    if (newIntervals.length === 0) return
    intervals.append(newIntervals)
    setIsAddingInterval(false)
  }

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
        <div className="work-hours__heading"><div><p className="section-label">Disponibilidade</p><h4 id="work-hours-title">Jornada de trabalho</h4></div><button type="button" className="quiet-action" onClick={toggleIntervalBuilder}>{isAddingInterval ? 'Fechar intervalo' : 'Adicionar intervalo diferente'}</button></div>
        {isAddingInterval && <div className="interval-builder"><p className="section-label">Aplicar o mesmo horário</p><fieldset><legend>Dias da semana</legend><div className="weekday-checkboxes">{weekdays.map((weekday) => { const occupied = form.getValues('horariosTrabalho').some((interval) => interval.diaSemana === weekday); return <label key={weekday}><input type="checkbox" checked={selectedDays.includes(weekday)} disabled={occupied} onChange={() => toggleDay(weekday)} />{weekdayLabels[weekday]}{occupied && <small>já cadastrada</small>}</label> })}</div></fieldset><div className="interval-builder__times"><label>Início<TimePicker id="new-interval-start" value={newStart} onChange={setNewStart} /></label><label>Fim<TimePicker id="new-interval-end" value={newEnd} onChange={setNewEnd} /></label></div><button type="button" className="primary-action" onClick={addIntervalGroup} disabled={selectedDays.length === 0}>Aplicar aos dias selecionados</button></div>}
        {intervals.fields.map((field, index) => <div className="interval-row" key={field.id}>
          <label>Dia<Controller control={form.control} name={`horariosTrabalho.${index}.diaSemana`} render={({ field }) => <Select id={`professional-weekday-${index}`} value={field.value} onChange={field.onChange} onBlur={field.onBlur} options={weekdays.map((weekday) => ({ value: weekday, label: weekdayLabels[weekday] }))} />} /></label>
          <label>Início<Controller control={form.control} name={`horariosTrabalho.${index}.inicio`} render={({ field }) => <TimePicker id={`professional-start-${index}`} value={field.value} onChange={field.onChange} onBlur={field.onBlur} invalid={Boolean(form.formState.errors.horariosTrabalho?.[index]?.inicio)} />} /></label>
          <label>Fim<Controller control={form.control} name={`horariosTrabalho.${index}.fim`} render={({ field }) => <TimePicker id={`professional-end-${index}`} value={field.value} onChange={field.onChange} onBlur={field.onBlur} invalid={Boolean(form.formState.errors.horariosTrabalho?.[index]?.fim)} />} /></label>
          <button type="button" className="remove-action" onClick={() => intervals.remove(index)} disabled={intervals.fields.length === 1} aria-label="Remover faixa de horário"><Trash2 size={17} strokeWidth={1.8} aria-hidden="true" /></button>
          {form.formState.errors.horariosTrabalho?.[index]?.fim && <small className="interval-error">{form.formState.errors.horariosTrabalho[index]?.fim?.message}</small>}
        </div>)}
        {form.formState.errors.horariosTrabalho?.message && <small className="field-error">{form.formState.errors.horariosTrabalho.message}</small>}
      </section>
      {error && <p className="form-error" role="alert">{error.message ?? 'Não foi possível salvar o profissional.'}</p>}
      <footer className="catalog-form__footer"><button type="button" className="quiet-action" onClick={onDone}>Cancelar</button><button type="submit" className="primary-action" disabled={isPending}>{isPending ? 'Salvando…' : professional ? 'Salvar alterações' : 'Cadastrar profissional'}</button></footer>
    </form>
  )
}
