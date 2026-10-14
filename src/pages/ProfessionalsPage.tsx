import { useEffect, useMemo, useState } from 'react'
import { ChevronDown, Plus, Search, UsersRound } from 'lucide-react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { ErrorState } from '../components/ui/ErrorState'
import { LoadingState } from '../components/ui/LoadingState'
import { ProfessionalConfirmDialog } from '../features/professionals/components/ProfessionalConfirmDialog'
import { ProfessionalList } from '../features/professionals/components/ProfessionalList'
import {
  useChangeProfessionalStatus,
  useDeleteProfessional,
  useProfessionals,
} from '../features/professionals/hooks/useProfessionals'
import type { ApiError } from '../types/api'
import type { ProfissionalResponse } from '../types/professionals'

type PendingAction = { type: 'status' | 'delete'; professional: ProfissionalResponse }
const scrollKey = 'agenda-plus:professionals-scroll'
const emptyProfessionals: ProfissionalResponse[] = []

function normalize(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR')
}

export function ProfessionalsPage() {
  const professionalsQuery = useProfessionals()
  const deleteProfessional = useDeleteProfessional()
  const changeStatus = useChangeProfessionalStatus()
  const navigate = useNavigate()
  const location = useLocation()
  const [params, setParams] = useSearchParams()
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const search = params.get('busca') ?? ''
  const order = params.get('ordem') === 'desc' ? 'desc' : 'asc'
  const professionals = professionalsQuery.data ?? emptyProfessionals
  const filtered = useMemo(() => {
    const query = normalize(search.trim())
    return professionals
      .filter(({ nome, especialidade }) => !query || normalize(`${nome} ${especialidade}`).includes(query))
      .sort((left, right) => (order === 'asc' ? 1 : -1) * left.nome.localeCompare(right.nome, 'pt-BR'))
  }, [professionals, search, order])

  useEffect(() => {
    if (!professionalsQuery.data) return
    const saved = sessionStorage.getItem(scrollKey)
    if (saved) {
      sessionStorage.removeItem(scrollKey)
      requestAnimationFrame(() => window.scrollTo(0, Number(saved)))
    }
  }, [professionalsQuery.data])

  function updateParam(key: string, value: string) {
    setParams((current) => {
      const next = new URLSearchParams(current)
      if (!value || (key === 'ordem' && value === 'asc')) next.delete(key)
      else next.set(key, value)
      return next
    }, { replace: true })
  }

  function openEditor(path: string) {
    sessionStorage.setItem(scrollKey, String(window.scrollY))
    navigate(`${path}${location.search}`)
  }

  async function confirmAction() {
    if (!pendingAction) return
    const { professional, type } = pendingAction
    setActionError(null)
    try {
      if (type === 'delete') {
        await deleteProfessional.mutateAsync(professional.id)
        setFeedback(`${professional.nome} foi excluído do cadastro.`)
      } else {
        const ativo = professional.ativo === false
        await changeStatus.mutateAsync({ id: professional.id, ativo })
        setFeedback(`${professional.nome} foi ${ativo ? 'ativado' : 'desativado'} com sucesso.`)
      }
      setPendingAction(null)
    } catch (error) {
      setActionError((error as ApiError).message || 'Não foi possível concluir a ação. Tente novamente.')
      setPendingAction(null)
    }
  }

  if (professionalsQuery.isLoading) return <LoadingState message="Abrindo os profissionais…" />
  if (professionalsQuery.isError) return <ErrorState message="Não foi possível carregar os profissionais." onRetry={() => void professionalsQuery.refetch()} />

  const notice = (location.state as { notice?: string } | null)?.notice
  return (
    <section className="professionals-page">
      {notice && <p className="professionals-feedback is-success" role="status">{notice}</p>}
      {feedback && <p className="professionals-feedback is-success" role="status">{feedback}</p>}
      {actionError && <p className="professionals-feedback is-error" role="alert">{actionError}</p>}
      {professionals.length > 0 && (
        <div className="professionals-page__top-action">
          <button type="button" onClick={() => openEditor('/painel/profissionais/novo')}><Plus size={18} aria-hidden="true" />Novo profissional</button>
        </div>
      )}
      {professionals.length === 0 ? (
        <div className="professionals-empty">
          <UsersRound size={34} aria-hidden="true" />
          <h2>Nenhum profissional cadastrado</h2>
          <p>Cadastre o primeiro profissional da equipe.</p>
          <button type="button" onClick={() => openEditor('/painel/profissionais/novo')}><Plus size={18} aria-hidden="true" />Cadastrar profissional</button>
        </div>
      ) : (
        <>
          <div className="professionals-toolbar">
            <label className="professionals-search">
              <Search size={19} aria-hidden="true" />
              <input type="search" aria-label="Buscar profissionais" placeholder="Buscar por nome ou especialidade..." value={search} onChange={(event) => updateParam('busca', event.target.value)} />
            </label>
            <label className="professionals-order">
              <span>Ordenar por</span>
              <span><select aria-label="Ordenar por" value={order} onChange={(event) => updateParam('ordem', event.target.value)}><option value="asc">Nome (A → Z)</option><option value="desc">Nome (Z → A)</option></select><ChevronDown size={16} aria-hidden="true" /></span>
            </label>
            <span className="professionals-count">{filtered.length} {filtered.length === 1 ? 'profissional' : 'profissionais'}</span>
          </div>
          {filtered.length === 0 ? (
            <p className="professionals-no-results" role="status">Nenhum profissional encontrado para “{search}”.</p>
          ) : (
            <ProfessionalList
              professionals={filtered}
              onNew={() => openEditor('/painel/profissionais/novo')}
              onEdit={(professional) => openEditor(`/painel/profissionais/${professional.id}/editar`)}
              onAgenda={(professional) => navigate(`/painel/agenda?profissionalId=${encodeURIComponent(professional.id)}`)}
              onToggleStatus={(professional) => setPendingAction({ type: 'status', professional })}
              onDelete={(professional) => setPendingAction({ type: 'delete', professional })}
              busyId={deleteProfessional.isPending ? deleteProfessional.variables : changeStatus.isPending ? changeStatus.variables?.id : undefined}
            />
          )}
        </>
      )}
      {pendingAction && <ProfessionalConfirmDialog
        title={pendingAction.type === 'delete' ? `Excluir ${pendingAction.professional.nome}?` : `${pendingAction.professional.ativo === false ? 'Ativar' : 'Desativar'} ${pendingAction.professional.nome}?`}
        description={pendingAction.type === 'delete'
          ? 'Esta ação é definitiva. Profissionais com agendamentos vinculados não podem ser excluídos; nesse caso, desative o cadastro.'
          : pendingAction.professional.ativo === false
            ? 'O profissional voltará a receber novos agendamentos conforme seus horários cadastrados.'
            : 'O profissional deixará de receber novos agendamentos. As reservas e o histórico existentes serão mantidos.'}
        confirmLabel={pendingAction.type === 'delete' ? 'Excluir profissional' : pendingAction.professional.ativo === false ? 'Ativar profissional' : 'Desativar profissional'}
        danger={pendingAction.type === 'delete'}
        busy={deleteProfessional.isPending || changeStatus.isPending}
        onCancel={() => setPendingAction(null)}
        onConfirm={() => void confirmAction()}
      />}
    </section>
  )
}
