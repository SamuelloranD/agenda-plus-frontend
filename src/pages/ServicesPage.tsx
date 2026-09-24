import { useState } from 'react'
import { EmptyState } from '../components/ui/EmptyState'
import { ErrorState } from '../components/ui/ErrorState'
import { LoadingState } from '../components/ui/LoadingState'
import { ServiceForm } from '../features/services/components/ServiceForm'
import { ServiceList } from '../features/services/components/ServiceList'
import { useDeleteService, useServices } from '../features/services/hooks/useServices'
import type { ServicoResponse } from '../types/services'

export function ServicesPage() {
  const servicesQuery = useServices()
  const deleteService = useDeleteService()
  const [editor, setEditor] = useState<'new' | ServicoResponse | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const remove = (service: ServicoResponse) => {
    if (!window.confirm(`Excluir ${service.nome}? Esta ação não pode ser desfeita.`)) return
    deleteService.mutate(service.id, { onSuccess: () => setNotice(`${service.nome} foi removido do catálogo.`) })
  }

  if (servicesQuery.isLoading) return <LoadingState message="Abrindo o catálogo de serviços…" />
  if (servicesQuery.isError) return <ErrorState message="Não foi possível carregar os serviços." onRetry={() => void servicesQuery.refetch()} />

  const services = servicesQuery.data ?? []
  return <section className="services-page"><header className="services-page__lead"><div><p className="section-label">Ofício & carta de cuidados</p><h2>Menu de <em>serviços.</em></h2><p>Defina apenas o que sua agenda precisa saber: nome, duração e valor de cada atendimento.</p></div><button className="primary-action" type="button" onClick={() => { setNotice(null); setEditor('new') }}>Novo serviço</button></header>
    {notice && <p className="success-notice" role="status">{notice}</p>}
    {deleteService.isError && <p className="form-error" role="alert">Não foi possível excluir este serviço.</p>}
    {editor && <ServiceForm service={editor === 'new' ? null : editor} onDone={() => { setEditor(null); setNotice(editor === 'new' ? 'Serviço cadastrado com sucesso.' : 'Serviço atualizado com sucesso.') }} />}
    {services.length === 0 ? <EmptyState message="Ainda não há serviços cadastrados." onAction={() => setEditor('new')} actionLabel="Cadastrar serviço" /> : <ServiceList services={services} onEdit={(service) => { setNotice(null); setEditor(service) }} onDelete={remove} deletingId={deleteService.isPending ? deleteService.variables : undefined} />}
  </section>
}
