import { useEffect, useRef, useState } from 'react'
import { useBlocker, useLocation, useNavigate, useParams } from 'react-router-dom'
import { ErrorState } from '../components/ui/ErrorState'
import { LoadingState } from '../components/ui/LoadingState'
import { ProfessionalConfirmDialog } from '../features/professionals/components/ProfessionalConfirmDialog'
import { ProfessionalForm } from '../features/professionals/components/ProfessionalForm'
import { useProfessional } from '../features/professionals/hooks/useProfessionals'
import { useAgendamentos } from '../features/scheduling/hooks/useAgendamentos'
import type { ApiError } from '../types/api'

function todayKey() {
  const today = new Date()
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
}

export function ProfessionalEditorPage() {
  const { id } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const listUrl = `/painel/profissionais${location.search}`
  const professionalQuery = useProfessional(id)
  const appointmentsQuery = useAgendamentos({ profissionalId: id, dataInicio: todayKey(), tamanho: 100 }, { allPages: true, enabled: Boolean(id) })
  const [dirty, setDirty] = useState(false)
  const bypass = useRef(false)
  const blocker = useBlocker(({ currentLocation, nextLocation }) => dirty && !bypass.current
    && (currentLocation.pathname !== nextLocation.pathname || currentLocation.search !== nextLocation.search))

  useEffect(() => {
    if (!dirty) return
    const warn = (event: BeforeUnloadEvent) => {
      if (bypass.current) return
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty])

  if (id && professionalQuery.isLoading) return <LoadingState message="Carregando profissional…" />
  if (id && professionalQuery.isError) {
    const status = (professionalQuery.error as ApiError).status
    if (status === 404) return <p className="professionals-feedback is-error" role="alert">Profissional não encontrado.</p>
    if (status === 403) return <p className="professionals-feedback is-error" role="alert">Você não tem permissão para editar este profissional.</p>
    return <ErrorState message="Não foi possível carregar o profissional." onRetry={() => void professionalQuery.refetch()} />
  }

  return (
    <section className="professional-editor-page">
      <ProfessionalForm
        key={id ?? 'new'}
        professional={id ? professionalQuery.data : null}
        appointments={appointmentsQuery.data?.conteudo ?? []}
        appointmentsLoading={Boolean(id) && appointmentsQuery.isLoading}
        appointmentsError={Boolean(id) && appointmentsQuery.isError}
        onDirtyChange={setDirty}
        onCancel={() => navigate(listUrl)}
        onDone={() => {
          bypass.current = true
          navigate(listUrl, { state: { notice: id ? 'Profissional atualizado com sucesso.' : 'Profissional cadastrado com sucesso.' } })
        }}
      />
      {blocker.state === 'blocked' && (
        <ProfessionalConfirmDialog
          title="Descartar alterações?"
          description="As mudanças feitas neste profissional ainda não foram salvas."
          confirmLabel="Descartar alterações"
          cancelLabel="Continuar editando"
          danger
          onCancel={() => blocker.reset()}
          onConfirm={() => blocker.proceed()}
        />
      )}
    </section>
  )
}
