import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useRef, useState } from 'react'
import { Info, X } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { useBlocker } from 'react-router-dom'
import type { ApiError } from '../../../types/api'
import type { ServicoResponse } from '../../../types/services'
import { ProfessionalConfirmDialog } from '../../professionals/components/ProfessionalConfirmDialog'
import { useCreateService, useUpdateService } from '../hooks/useServices'
import { serviceSchema, type ServiceFormInput, type ServiceFormValues } from '../schemas/serviceSchema'

interface ServiceFormProps {
  service?: ServicoResponse | null
  onDone: () => void
  onCancel?: () => void
}
const emptyValues: ServiceFormValues = { nome: '', descricao: '', duracaoMinutos: 30, preco: { valor: 0, moeda: 'BRL' }, ativo: true }
export function parseBrazilianPrice(value: string) {
  const text = value.trim()
  if (!/^(?:0|[1-9]\d*|[1-9]\d{0,2}(?:\.\d{3})+)(?:,\d{1,2})?$/.test(text)) return Number.NaN
  const [whole, fraction = ''] = text.replaceAll('.', '').split(',')
  const cents = BigInt(whole) * 100n + BigInt(fraction.padEnd(2, '0') || '0')
  return cents <= BigInt(Number.MAX_SAFE_INTEGER) ? Number(cents) / 100 : Number.NaN
}

export function ServiceForm({ service, onDone, onCancel }: ServiceFormProps) {
  const form = useForm<ServiceFormInput, unknown, ServiceFormValues>({ resolver: zodResolver(serviceSchema), defaultValues: emptyValues })
  const createService = useCreateService()
  const updateService = useUpdateService()
  const [confirmClose, setConfirmClose] = useState(false)
  const [priceText, setPriceText] = useState(service ? service.preco.valor.toFixed(2).replace('.', ',') : '')
  const panelRef = useRef<HTMLElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const allowNavigation = useRef(false)
  const cancel = onCancel ?? onDone
  const blocker = useBlocker(() => form.formState.isDirty && !allowNavigation.current)

  useEffect(() => {
    form.reset(service ? { nome: service.nome, descricao: service.descricao ?? '', duracaoMinutos: service.duracaoMinutos, preco: { valor: service.preco.valor, moeda: 'BRL' }, ativo: service.ativo !== false } : emptyValues)
    setPriceText(service ? service.preco.valor.toFixed(2).replace('.', ',') : '')
  }, [service, form])
  useEffect(() => {
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const oldOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus()
    return () => { document.body.style.overflow = oldOverflow; previous?.focus() }
  }, [])
  useEffect(() => {
    if (!form.formState.isDirty) return
    const protectDraft = (event: BeforeUnloadEvent) => { event.preventDefault() }
    window.addEventListener('beforeunload', protectDraft)
    return () => window.removeEventListener('beforeunload', protectDraft)
  }, [form.formState.isDirty])
  const discard = () => { allowNavigation.current = true; cancel() }
  const requestClose = () => { if (isPending) return; if (form.formState.isDirty) setConfirmClose(true); else discard() }
  const submit = (values: ServiceFormValues) => {
    if (!priceText.trim()) { form.setError('preco.valor', { message: 'Informe o preço.' }); return }
    if (service) updateService.mutate({ id: service.id, input: values }, { onSuccess: () => { allowNavigation.current = true; onDone() } })
    else createService.mutate(values, { onSuccess: () => { allowNavigation.current = true; onDone() } })
  }
  const isPending = createService.isPending || updateService.isPending
  const error = (createService.error ?? updateService.error) as ApiError | null
  const fields = form.formState.errors
  return <>
    <div className="services-drawer-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) requestClose() }}>
      <section className="services-drawer" ref={panelRef} role="dialog" aria-modal="true" aria-labelledby="services-drawer-title" onKeyDown={(event) => {
        if (event.key === 'Escape' && !confirmClose) { event.preventDefault(); requestClose() }
        if (event.key === 'Tab' && !confirmClose) {
          const focusable = Array.from(panelRef.current?.querySelectorAll<HTMLElement>('button:not([disabled]),input:not([disabled]),textarea:not([disabled])') ?? [])
          const first = focusable[0], last = focusable[focusable.length - 1]
          if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus() }
          else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus() }
        }
      }}>
        <form onSubmit={form.handleSubmit(submit)} noValidate>
          <header className="services-drawer__header"><div><h2 id="services-drawer-title">{service ? 'Editar serviço' : 'Novo serviço'}</h2><p>{service ? 'Atualize as informações do serviço.' : 'Defina o serviço que será oferecido no agendamento.'}</p></div><button ref={closeRef} type="button" className="services-drawer__close" aria-label="Fechar painel" onClick={requestClose}><X size={20} /></button></header>
          <div className="services-drawer__body">
            <label className="services-field">Nome do serviço <span>*</span><input autoFocus {...form.register('nome')} placeholder="Ex.: Corte de cabelo" aria-invalid={Boolean(fields.nome)} />{fields.nome && <small role="alert">{fields.nome.message}</small>}</label>
            <label className="services-field">Descrição<textarea {...form.register('descricao')} maxLength={500} rows={3} placeholder="Descreva o serviço..." aria-invalid={Boolean(fields.descricao)} />{fields.descricao && <small role="alert">{fields.descricao.message}</small>}<em>{(form.watch('descricao') ?? '').length}/500</em></label>
            <div className="services-drawer__pair"><label className="services-field">Duração (minutos) <span>*</span><input type="number" min="1" step="1" {...form.register('duracaoMinutos', { valueAsNumber: true })} aria-invalid={Boolean(fields.duracaoMinutos)} />{fields.duracaoMinutos && <small role="alert">{fields.duracaoMinutos.message}</small>}</label><label className="services-field">Preço (R$) <span>*</span><input type="text" inputMode="decimal" value={priceText} placeholder="0,00" onChange={(event) => { setPriceText(event.target.value); form.setValue('preco.valor', parseBrazilianPrice(event.target.value), { shouldDirty: true, shouldValidate: true }) }} aria-invalid={Boolean(fields.preco?.valor)} />{fields.preco?.valor && <small role="alert">{fields.preco.valor.message}</small>}</label></div>
            <label className="services-switch-row"><span><strong>Status</strong><small>Serviços inativos não aparecem no novo agendamento.</small></span><input type="checkbox" {...form.register('ativo')} aria-label="Serviço ativo" /><span className="services-switch" aria-hidden="true" />{form.watch('ativo') ? 'Ativo' : 'Inativo'}</label>
            <div className="services-drawer__info"><Info size={18} aria-hidden="true" /><p>As reservas existentes mantêm seus horários. O sistema ainda não armazena o preço histórico; alterar o preço pode mudar o valor exibido em agendamentos anteriores.</p></div>
            {error && <p className="form-error" role="alert">{error.message ?? 'Não foi possível salvar o serviço.'}</p>}
          </div>
          <footer className="services-drawer__footer"><button type="button" className="services-drawer__cancel" onClick={requestClose}>Cancelar</button><button type="submit" className="primary-action" disabled={isPending}>{isPending ? 'Salvando…' : service ? 'Salvar alterações' : 'Cadastrar serviço'}</button></footer>
        </form>
      </section>
    </div>
    {(confirmClose || blocker.state === 'blocked') && <ProfessionalConfirmDialog title="Descartar alterações?" description="As mudanças feitas neste serviço ainda não foram salvas." cancelLabel="Continuar editando" confirmLabel="Descartar alterações" danger onCancel={() => { setConfirmClose(false); if (blocker.state === 'blocked') blocker.reset() }} onConfirm={() => { if (blocker.state === 'blocked') blocker.proceed(); else discard() }} />}
  </>
}
