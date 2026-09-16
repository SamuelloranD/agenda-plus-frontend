import { Link, useNavigate } from 'react-router-dom'
import type { UserRole } from '../../../types/auth'

interface BookingAuthPromptProps {
  role?: UserRole
  isLoading: boolean
  onSwitchAccount: () => void
}

const authSearch = '?returnTo=%2Fagendar'

export function BookingAuthPrompt({ role, isLoading, onSwitchAccount }: BookingAuthPromptProps) {
  const navigate = useNavigate()

  if (isLoading) {
    return <p className="booking-auth-prompt" role="status">Confirmando sua identidade…</p>
  }

  if (role === 'ADMIN') {
    return (
      <section className="booking-auth-prompt" id="booking-auth" aria-labelledby="booking-admin-title">
        <p className="eyebrow">CONTA DE CLIENTE</p>
        <h3 id="booking-admin-title">Esta sessão é administrativa</h3>
        <p>Para reservar este horário, entre com uma conta de cliente. Suas escolhas ficarão guardadas.</p>
        <button type="button" onClick={() => {
          onSwitchAccount()
          navigate(`/login${authSearch}`)
        }}>Trocar de conta →</button>
      </section>
    )
  }

  return (
    <section className="booking-auth-prompt" id="booking-auth" aria-labelledby="booking-auth-title">
      <p className="eyebrow">ÚLTIMO PASSO</p>
      <h3 id="booking-auth-title">Identifique-se para confirmar</h3>
      <p>Entre ou crie uma conta de cliente. Serviço, profissional, data e horário serão preservados.</p>
      <div className="booking-auth-actions">
        <Link className="booking-auth-primary" to={`/login${authSearch}`}>Entrar</Link>
        <Link to={`/cadastro${authSearch}`}>Criar conta de cliente</Link>
      </div>
    </section>
  )
}
