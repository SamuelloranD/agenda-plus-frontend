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
  return <section className="catalog-page"><header className="catalog-page__lead"><div><p className="section-label">Corpo técnico & cadeiras</p><h2>Mestres e especialistas <em>da&nbsp;casa.</em></h2><p>Cadastre a equipe e registre apenas as especialidades e jornadas disponíveis para os atendimentos.</p></div><button className="primary-action" type="button" onClick={() => { setNotice(null); setEditor('new') }}>Novo profissional</button></header>
    {notice && <p className="success-notice" role="status">{notice}</p>}
    {deleteProfessional.isError && <p className="form-error" role="alert">Não foi possível excluir este profissional.</p>}
    {editor && <ProfessionalForm professional={editor === 'new' ? null : editor} onDone={() => { setEditor(null); setNotice(editor === 'new' ? 'Profissional cadastrado com sucesso.' : 'Cadastro atualizado com sucesso.') }} />}
    {professionals.length === 0 ? <EmptyState message="Ainda não há profissionais cadastrados." onAction={() => setEditor('new')} actionLabel="Cadastrar profissional" /> : <ProfessionalList professionals={professionals} onEdit={(professional) => { setNotice(null); setEditor(professional) }} onDelete={remove} deletingId={deleteProfessional.isPending ? deleteProfessional.variables : undefined} />}
  </section>
}
