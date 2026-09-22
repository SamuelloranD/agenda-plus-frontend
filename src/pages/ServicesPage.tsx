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
  return <section className="services-page"><style>{servicesStyles}</style><header className="services-page__lead"><div><p className="section-label">Ofício & carta de cuidados</p><h2>Menu de <em>serviços.</em></h2><p>Defina apenas o que sua agenda precisa saber: nome, duração e valor de cada atendimento.</p></div><button className="primary-action" type="button" onClick={() => { setNotice(null); setEditor('new') }}>Novo serviço</button></header>
    {notice && <p className="success-notice" role="status">{notice}</p>}
    {deleteService.isError && <p className="form-error" role="alert">Não foi possível excluir este serviço.</p>}
    {editor && <ServiceForm service={editor === 'new' ? null : editor} onDone={() => { setEditor(null); setNotice(editor === 'new' ? 'Serviço cadastrado com sucesso.' : 'Serviço atualizado com sucesso.') }} />}
    {services.length === 0 ? <EmptyState message="Ainda não há serviços cadastrados." onAction={() => setEditor('new')} actionLabel="Cadastrar serviço" /> : <ServiceList services={services} onEdit={(service) => { setNotice(null); setEditor(service) }} onDelete={remove} deletingId={deleteService.isPending ? deleteService.variables : undefined} />}
  </section>
}

const servicesStyles = `
.services-page{display:grid;gap:28px;padding-bottom:48px;background-image:radial-gradient(#d9cfc0 .6px,transparent .6px);background-size:18px 18px}.services-page__lead{display:flex;align-items:end;justify-content:space-between;gap:28px}.services-page__lead>div{max-width:740px}.services-page__lead h2{margin:0;font:500 clamp(36px,4.5vw,58px)/1.02 'Newsreader',Georgia,serif;letter-spacing:-.03em}.services-page__lead h2 em{color:var(--terracotta);font-weight:400}.services-page__lead>div>p:last-child{max-width:650px;margin:16px 0 0;color:var(--muted-ink);line-height:1.6}.success-notice{margin:0;padding:13px 16px;color:var(--olive);background:#edf2eb;border-left:3px solid var(--olive);font-size:13px}.service-form{display:grid;gap:17px;padding:26px;background:rgb(251 249 245 / 94%);border:1px solid var(--line)}.service-form header h3{margin:0;font:500 27px/1.1 'Newsreader',Georgia,serif}.service-form>label,.service-form__values label{display:grid;gap:7px;font-size:10px;font-weight:700;letter-spacing:.1em;text-transform:uppercase}.service-form input{min-height:44px;padding:10px 12px;color:var(--ink);background:var(--paper);border:1px solid var(--line);border-radius:4px;font:inherit;letter-spacing:normal;text-transform:none}.service-form input:focus{outline:2px solid color-mix(in srgb,var(--terracotta) 42%,transparent);border-color:var(--terracotta)}.service-form small{color:#a52720;font-size:12px;letter-spacing:normal;text-transform:none}.service-form__values{display:grid;grid-template-columns:1fr 1fr .7fr;gap:12px}.service-form footer{display:flex;justify-content:flex-end;gap:10px;padding-top:7px}.quiet-action,.danger-action{padding:10px 13px;border:1px solid var(--line);border-radius:4px;cursor:pointer;font-size:12px;font-weight:700}.quiet-action{color:var(--ink);background:var(--paper)}.quiet-action:hover{background:#f1ebe3}.danger-action{color:#a52720;background:#fff5f1;border-color:#e4c6bd}.danger-action:disabled{opacity:.65;cursor:wait}.service-list{display:grid;gap:12px}.service-row{display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:17px;align-items:center;padding:21px 24px;background:rgb(251 249 245 / 92%);border:1px solid var(--line);border-left:4px solid var(--olive)}.service-row--1{border-left-color:var(--terracotta)}.service-row--2{border-left-color:#a57925}.service-row__glyph{display:grid;place-items:center;width:44px;height:44px;color:var(--olive);background:#edf2eb;border-radius:4px}.service-row--1 .service-row__glyph{color:var(--terracotta);background:#f9eae4}.service-row--2 .service-row__glyph{color:#8d601c;background:#f9f0db}.service-row__main h3{margin:1px 0 7px;font:500 27px/1.08 'Newsreader',Georgia,serif}.service-row__main div{display:flex;gap:9px;color:var(--muted-ink);font-size:12px}.service-row__main i{color:var(--terracotta);font-style:normal}.service-row__price{display:grid;justify-items:end}.service-row__price small{color:var(--muted-ink);font-size:10px;font-weight:700;letter-spacing:.1em;text-transform:uppercase}.service-row__price strong{font:500 25px 'Newsreader',Georgia,serif}.catalog-card__actions{grid-column:2/-1;display:flex;justify-content:flex-end;gap:8px;padding-top:4px;border-top:1px solid var(--line)}@media(max-width:680px){.services-page__lead{align-items:start;flex-direction:column}.services-page__lead .primary-action{width:100%}.service-form__values{grid-template-columns:1fr}.service-row{grid-template-columns:auto minmax(0,1fr)}.service-row__price{grid-column:2;justify-items:start}.catalog-card__actions{grid-column:1/-1}}
`
