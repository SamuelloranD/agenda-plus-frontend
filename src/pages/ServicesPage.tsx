import { useEffect, useMemo, useRef, useState } from 'react'
import { Check, ChevronDown, Layers3, Plus, Search } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { ErrorState } from '../components/ui/ErrorState'
import { LoadingState } from '../components/ui/LoadingState'
import { ProfessionalConfirmDialog } from '../features/professionals/components/ProfessionalConfirmDialog'
import { ServiceForm } from '../features/services/components/ServiceForm'
import { ServiceList } from '../features/services/components/ServiceList'
import { useChangeServiceStatus, useDeleteService, useService, useServices } from '../features/services/hooks/useServices'
import type { ApiError } from '../types/api'
import type { ServicoResponse } from '../types/services'

type Action = { type: 'delete' | 'status'; service: ServicoResponse }
const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR')
const emptyServices: ServicoResponse[] = []

export function ServicesPage() {
  const servicesQuery = useServices()
  const deleteService = useDeleteService()
  const changeStatus = useChangeServiceStatus()
  const [params, setParams] = useSearchParams()
  const editorId = params.get('servico')
  const editorQuery = useService(editorId && editorId !== 'novo' ? editorId : null)
  const [action, setAction] = useState<Action | null>(null)
  const search = params.get('busca') ?? ''
  const order = params.get('ordem') === 'desc' ? 'desc' : 'asc'
  const [orderOpen, setOrderOpen] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const orderRef = useRef<HTMLDivElement>(null)
  const services = servicesQuery.data ?? emptyServices
  const updateParam = (key: string, value: string, replace = true) => setParams((current) => {
    const next = new URLSearchParams(current)
    if (value) next.set(key, value)
    else next.delete(key)
    return next
  }, { replace })
  const closeEditor = () => updateParam('servico', '')
  const filtered = useMemo(() => services.filter(({ nome }) => normalize(nome).includes(normalize(search.trim()))).sort((a, b) => (order === 'asc' ? 1 : -1) * a.nome.localeCompare(b.nome, 'pt-BR')), [services, search, order])

  useEffect(() => {
    if (!orderOpen) return
    const close = (event: PointerEvent) => { if (!orderRef.current?.contains(event.target as Node)) setOrderOpen(false) }
    document.addEventListener('pointerdown', close)
    return () => document.removeEventListener('pointerdown', close)
  }, [orderOpen])

  const confirmAction = () => {
    if (!action) return
    const { type, service } = action
    const mutation = type === 'delete'
      ? deleteService.mutateAsync(service.id)
      : changeStatus.mutateAsync({ id: service.id, ativo: service.ativo === false })
    void mutation.then(() => {
      setNotice(type === 'delete' ? `${service.nome} foi excluído.` : `${service.nome} foi ${service.ativo === false ? 'ativado' : 'desativado'}.`)
      setAction(null)
    }).catch((error: ApiError) => {
      setAction(null)
      setActionError(error.message ?? 'Não foi possível concluir a ação.')
    })
  }
  if (servicesQuery.isLoading) return <LoadingState message="Abrindo o catálogo de serviços…" />
  if (servicesQuery.isError) return <ErrorState message="Não foi possível carregar os serviços." onRetry={() => void servicesQuery.refetch()} />

  return <section className="services-redesign">
    <div className="services-redesign__top"><button className="primary-action" type="button" onClick={() => { setNotice(null); updateParam('servico', 'novo', false) }}><Plus size={17} aria-hidden="true" />Novo serviço</button></div>
    <div className="services-toolbar"><label className="services-search"><Search size={18} aria-hidden="true" /><input type="search" value={search} onChange={(event) => updateParam('busca', event.target.value)} placeholder="Buscar por nome do serviço..." aria-label="Buscar serviços" /></label><div className="services-order" ref={orderRef} onKeyDown={(event) => { if (event.key === 'Escape') { setOrderOpen(false); event.stopPropagation() } }}><span>Ordenar por</span><button type="button" aria-label="Ordenar por" aria-expanded={orderOpen} onClick={() => setOrderOpen((open) => !open)}>Nome ({order === 'asc' ? 'A   Z' : 'Z   A'})<ChevronDown size={16} aria-hidden="true" /></button>{orderOpen && <div className="services-order__menu">{(['asc', 'desc'] as const).map((option) => <button key={option} type="button" aria-pressed={order === option} onClick={() => { updateParam('ordem', option === 'asc' ? '' : option); setOrderOpen(false) }}>Nome ({option === 'asc' ? 'A   Z' : 'Z   A'}){order === option && <Check size={16} />}</button>)}</div>}</div></div>
    <p className="services-count">{filtered.length} {filtered.length === 1 ? 'serviço' : 'serviços'}{search.trim() ? ' encontrado' + (filtered.length === 1 ? '' : 's') : ''}</p>
    {notice && <p className="success-notice" role="status">{notice}</p>}
    {actionError && <p className="form-error" role="alert">{actionError}</p>}
    {services.length === 0 ? <div className="services-empty"><Layers3 size={48} aria-hidden="true" /><h2>Seu catálogo ainda está vazio.</h2><p>Cadastre o primeiro serviço para organizar seus atendimentos.</p><button className="primary-action" type="button" onClick={() => updateParam('servico', 'novo', false)}><Plus size={17} />Novo serviço</button></div> : filtered.length === 0 ? <div className="services-empty"><Search size={48} aria-hidden="true" /><h2>Nenhum serviço encontrado.</h2><p>Tente outro nome ou limpe a busca.</p><button type="button" className="services-outline" onClick={() => updateParam('busca', '')}>Limpar busca</button></div> : <ServiceList services={filtered} onEdit={(service) => { setNotice(null); updateParam('servico', service.id, false) }} onDelete={(service) => { setActionError(null); setAction({ type: 'delete', service }) }} onStatus={(service) => { setActionError(null); setAction({ type: 'status', service }) }} deletingId={deleteService.isPending ? deleteService.variables : undefined} />}
    {editorId && (editorId === 'novo' ? <ServiceForm key="novo" onCancel={closeEditor} onDone={() => { closeEditor(); setNotice('Serviço cadastrado com sucesso.') }} /> : editorQuery.isLoading ? <div className="services-modal-backdrop"><div className="services-modal services-modal--state" role="dialog" aria-modal="true" aria-label="Carregando serviço"><LoadingState message="Carregando serviço…" /></div></div> : editorQuery.isError || !editorQuery.data ? <div className="services-modal-backdrop"><div className="services-modal services-modal--state" role="dialog" aria-modal="true" aria-label="Erro ao carregar serviço"><ErrorState message="Não foi possível carregar este serviço." onRetry={() => void editorQuery.refetch()} /><button type="button" onClick={closeEditor}>Fechar</button></div></div> : <ServiceForm key={editorId} service={editorQuery.data} onCancel={closeEditor} onDone={() => { closeEditor(); setNotice('Serviço atualizado com sucesso.') }} />)}
    {action && <ProfessionalConfirmDialog title={action.type === 'delete' ? 'Excluir serviço?' : action.service.ativo === false ? 'Ativar serviço?' : 'Desativar serviço?'} description={action.type === 'delete' ? `Excluir ${action.service.nome}? A exclusão será impedida se houver agendamentos vinculados.` : action.service.ativo === false ? 'O serviço voltará a aparecer no novo agendamento.' : 'O serviço deixará de aparecer no novo agendamento. As reservas existentes serão mantidas.'} confirmLabel={action.type === 'delete' ? 'Excluir serviço' : action.service.ativo === false ? 'Ativar serviço' : 'Desativar serviço'} danger={action.type === 'delete'} busy={deleteService.isPending || changeStatus.isPending} onCancel={() => setAction(null)} onConfirm={confirmAction} />}
  </section>
}
