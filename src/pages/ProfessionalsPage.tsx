import { useState } from 'react'
import { EmptyState } from '../components/ui/EmptyState'
import { ErrorState } from '../components/ui/ErrorState'
import { LoadingState } from '../components/ui/LoadingState'
import { ProfessionalForm } from '../features/professionals/components/ProfessionalForm'
import { ProfessionalList } from '../features/professionals/components/ProfessionalList'
import { useDeleteProfessional, useProfessionals } from '../features/professionals/hooks/useProfessionals'
import type { ProfissionalResponse } from '../types/professionals'

export function ProfessionalsPage() {
  const professionalsQuery = useProfessionals()
  const deleteProfessional = useDeleteProfessional()
  const [editor, setEditor] = useState<'new' | ProfissionalResponse | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const remove = (professional: ProfissionalResponse) => {
    if (!window.confirm(`Excluir ${professional.nome}? Esta ação não pode ser desfeita.`)) return
    deleteProfessional.mutate(professional.id, { onSuccess: () => setNotice(`${professional.nome} foi removido do cadastro.`) })
  }

  if (professionalsQuery.isLoading) return <LoadingState message="Abrindo os profissionais…" />
  if (professionalsQuery.isError) return <ErrorState message="Não foi possível carregar os profissionais." onRetry={() => void professionalsQuery.refetch()} />

  const professionals = professionalsQuery.data ?? []
  return <section className="catalog-page"><style>{catalogStyles}</style><header className="catalog-page__lead"><div><p className="section-label">Corpo técnico & cadeiras</p><h2>Mestres e especialistas <em>da casa.</em></h2><p>Cadastre a equipe e registre apenas as especialidades e jornadas disponíveis para os atendimentos.</p></div><button className="primary-action" type="button" onClick={() => { setNotice(null); setEditor('new') }}>Novo profissional</button></header>
    {notice && <p className="success-notice" role="status">{notice}</p>}
    {deleteProfessional.isError && <p className="form-error" role="alert">Não foi possível excluir este profissional.</p>}
    {editor && <ProfessionalForm professional={editor === 'new' ? null : editor} onDone={() => { setEditor(null); setNotice(editor === 'new' ? 'Profissional cadastrado com sucesso.' : 'Cadastro atualizado com sucesso.') }} />}
    {professionals.length === 0 ? <EmptyState message="Ainda não há profissionais cadastrados." onAction={() => setEditor('new')} actionLabel="Cadastrar profissional" /> : <ProfessionalList professionals={professionals} onEdit={(professional) => { setNotice(null); setEditor(professional) }} onDelete={remove} deletingId={deleteProfessional.isPending ? deleteProfessional.variables : undefined} />}
  </section>
}

const catalogStyles = `
.catalog-page{display:grid;gap:28px;padding-bottom:48px;background-image:radial-gradient(#d9cfc0 .6px,transparent .6px);background-size:18px 18px}.catalog-page__lead{display:flex;align-items:end;justify-content:space-between;gap:28px}.catalog-page__lead>div{max-width:740px}.catalog-page__lead h2{margin:0;font:500 clamp(36px,4.5vw,58px)/1.02 'Newsreader',Georgia,serif;letter-spacing:-.03em}.catalog-page__lead h2 em{color:var(--terracotta);font-weight:400}.catalog-page__lead>div>p:last-child{max-width:650px;margin:16px 0 0;color:var(--muted-ink);line-height:1.6}.success-notice{margin:0;padding:13px 16px;color:var(--olive);background:#edf2eb;border-left:3px solid var(--olive);font-size:13px}.catalog-form{display:grid;gap:17px;padding:26px;background:rgb(251 249 245 / 94%);border:1px solid var(--line)}.catalog-form header h3,.work-hours h4{margin:0;font:500 27px/1.1 'Newsreader',Georgia,serif}.catalog-field{display:grid;gap:7px;font-size:10px;font-weight:700;letter-spacing:.1em;text-transform:uppercase}.catalog-field input,.interval-row select,.interval-row input{min-height:44px;padding:10px 12px;color:var(--ink);background:var(--paper);border:1px solid var(--line);border-radius:4px;font:inherit;letter-spacing:normal;text-transform:none}.catalog-field input:focus,.interval-row select:focus,.interval-row input:focus{outline:2px solid color-mix(in srgb,var(--terracotta) 42%,transparent);border-color:var(--terracotta)}.catalog-field small,.field-error,.interval-error{color:#a52720;font-size:12px;letter-spacing:normal;text-transform:none}.work-hours{display:grid;gap:12px;padding-top:10px}.work-hours__heading{display:flex;align-items:end;justify-content:space-between;gap:20px}.interval-row{position:relative;display:grid;grid-template-columns:1.5fr 1fr 1fr auto;gap:10px;align-items:end;padding:14px;background:#f3eee7;border:1px solid var(--line)}.interval-row label{display:grid;gap:5px;color:var(--muted-ink);font-size:10px;font-weight:700;letter-spacing:.08em;text-transform:uppercase}.interval-row input,.interval-row select{min-width:0}.interval-error{grid-column:1/-1}.catalog-form__footer{display:flex;justify-content:flex-end;gap:10px;padding-top:7px}.quiet-action,.danger-action{padding:10px 13px;border:1px solid var(--line);border-radius:4px;cursor:pointer;font-size:12px;font-weight:700}.quiet-action{color:var(--ink);background:var(--paper)}.quiet-action:hover{background:#f1ebe3}.danger-action{color:#a52720;background:#fff5f1;border-color:#e4c6bd}.danger-action:disabled{opacity:.65;cursor:wait}.remove-action{width:35px;height:35px;color:#a52720;background:transparent;border:1px solid #e4c6bd;border-radius:50%;cursor:pointer;font-size:20px}.remove-action:disabled{opacity:.35;cursor:not-allowed}.professional-list{display:grid;grid-template-columns:repeat(auto-fit,minmax(270px,1fr));gap:18px}.professional-card{display:grid;grid-template-columns:auto 1fr;gap:15px;padding:22px;background:rgb(251 249 245 / 92%);border:1px solid var(--line);border-top:3px solid var(--olive)}.professional-card__mark{display:grid;place-items:center;width:47px;height:47px;color:var(--paper);background:var(--olive);border-radius:50%;font:500 18px 'Newsreader',Georgia,serif}.professional-card__mark--1{background:var(--terracotta)}.professional-card__mark--2{background:#a57925}.professional-card__main h3{margin:1px 0 5px;font:500 26px/1.05 'Newsreader',Georgia,serif}.professional-card__main>p:not(.section-label){margin:0;color:var(--muted-ink);font-size:13px}.work-pill-list{display:flex;flex-wrap:wrap;gap:6px;margin-top:16px}.work-pill-list span{padding:5px 7px;color:var(--olive);background:#edf2eb;border-radius:3px;font-size:10px}.catalog-card__actions{grid-column:1/-1;display:flex;justify-content:flex-end;gap:8px;padding-top:4px;border-top:1px solid var(--line)}@media(max-width:680px){.catalog-page__lead{align-items:start;flex-direction:column}.catalog-page__lead .primary-action{width:100%}.interval-row{grid-template-columns:1fr 1fr}.interval-row label:first-child{grid-column:1/-1}.interval-row .remove-action{align-self:end}.professional-list{grid-template-columns:1fr}}
`
