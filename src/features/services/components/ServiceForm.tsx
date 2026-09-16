import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import type { ApiError } from '../../../types/api'
import type { ServicoResponse } from '../../../types/services'
import { useCreateService, useUpdateService } from '../hooks/useServices'
import { serviceSchema, type ServiceFormValues } from '../schemas/serviceSchema'

interface ServiceFormProps {
  service?: ServicoResponse | null
  onDone: () => void
}

const emptyValues: ServiceFormValues = { nome: '', duracaoMinutos: 30, preco: { valor: 0, moeda: 'BRL' } }

export function ServiceForm({ service, onDone }: ServiceFormProps) {
  const form = useForm<ServiceFormValues>({ resolver: zodResolver(serviceSchema), defaultValues: emptyValues })
  const createService = useCreateService()
  const updateService = useUpdateService()

  useEffect(() => {
    form.reset(service ? { nome: service.nome, duracaoMinutos: service.duracaoMinutos, preco: service.preco } : emptyValues)
  }, [service, form])

  const submit = (values: ServiceFormValues) => {
    if (service) updateService.mutate({ id: service.id, input: values }, { onSuccess: onDone })
    else createService.mutate(values, { onSuccess: onDone })
  }
  const isPending = createService.isPending || updateService.isPending
  const error = (createService.error ?? updateService.error) as ApiError | null

  return <form className="service-form" onSubmit={form.handleSubmit(submit)} noValidate>
    <header><p className="section-label">{service ? 'Ajustar ritual' : 'Novo ritual'}</p><h3>{service ? service.nome : 'Adicionar serviço'}</h3></header>
    <label>Nome do serviço<input {...form.register('nome')} placeholder="Ex.: Corte clássico" aria-invalid={Boolean(form.formState.errors.nome)} />{form.formState.errors.nome && <small>{form.formState.errors.nome.message}</small>}</label>
    <div className="service-form__values"><label>Duração (minutos)<input type="number" min="1" step="1" {...form.register('duracaoMinutos', { valueAsNumber: true })} aria-invalid={Boolean(form.formState.errors.duracaoMinutos)} />{form.formState.errors.duracaoMinutos && <small>{form.formState.errors.duracaoMinutos.message}</small>}</label><label>Valor<input type="number" min="0.01" step="0.01" {...form.register('preco.valor', { valueAsNumber: true })} aria-invalid={Boolean(form.formState.errors.preco?.valor)} />{form.formState.errors.preco?.valor && <small>{form.formState.errors.preco.valor.message}</small>}</label><label>Moeda<input {...form.register('preco.moeda')} placeholder="BRL" aria-invalid={Boolean(form.formState.errors.preco?.moeda)} />{form.formState.errors.preco?.moeda && <small>{form.formState.errors.preco.moeda.message}</small>}</label></div>
    {error && <p className="form-error" role="alert">{error.message ?? 'Não foi possível salvar o serviço.'}</p>}
    <footer><button type="button" className="quiet-action" onClick={onDone}>Cancelar</button><button type="submit" className="primary-action" disabled={isPending}>{isPending ? 'Salvando…' : service ? 'Salvar alterações' : 'Cadastrar serviço'}</button></footer>
  </form>
}
