import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import type { ZodType } from 'zod'
import type { ApiError } from '../../../types/api'
import type { LoginInput } from '../../../types/auth'
import { getPendingReturnPath, useLoginMutation } from '../hooks/useAuthMutations'
import { loginSchema } from '../schemas/authSchemas'

function loginErrorMessage(error: unknown) {
  const apiError = error as ApiError | undefined
  if (apiError?.status === 401 || apiError?.code === 'INVALID_CREDENTIALS') {
    return 'E-mail ou senha incorretos. Confira os dados e tente novamente.'
  }

  return apiError?.message ?? 'Não foi possível entrar agora. Tente novamente.'
}

export function LoginForm() {
  const navigate = useNavigate()
  const location = useLocation()
  const login = useLoginMutation()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema as ZodType<LoginInput, LoginInput>),
    defaultValues: { email: '', senha: '' },
  })

  const onSubmit = handleSubmit(async (input) => {
    try {
      const user = await login.mutateAsync(input)
      const returnTo = getPendingReturnPath(location.search)
      navigate(user.role === 'ADMIN' ? '/painel' : returnTo ?? '/agendar', { replace: true })
    } catch {
      // React Query exposes the normalized failure beside the form.
    }
  })

  return (
    <div className="auth-form-wrap">
      <div className="auth-meta">
        <span>ACESSO RESTRITO</span>
        <span className="auth-secure"><i aria-hidden="true" /> SESSÃO CRIPTOGRAFADA</span>
      </div>
      <header className="auth-form-header">
        <h1 aria-label="Entrar">Entrar no Estúdio</h1>
        <p>Abra seu diário de reservas, serviços e clientes para a jornada de hoje.</p>
      </header>
      <form className="auth-form" onSubmit={onSubmit} noValidate>
        <div className="auth-field">
          <label htmlFor="login-email">E-MAIL PROFISSIONAL</label>
          <input
            id="login-email"
            type="email"
            autoComplete="email"
            placeholder="mestre@seuatelie.com.br"
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? 'login-email-error' : undefined}
            {...register('email')}
          />
          {errors.email && <span className="field-error" id="login-email-error">{errors.email.message}</span>}
        </div>
        <div className="auth-field">
          <label htmlFor="login-password">CHAVE SECRETA (SENHA)</label>
          <input
            id="login-password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••••••"
            aria-invalid={Boolean(errors.senha)}
            aria-describedby={errors.senha ? 'login-password-error' : undefined}
            {...register('senha')}
          />
          {errors.senha && <span className="field-error" id="login-password-error">{errors.senha.message}</span>}
        </div>
        {login.isError && <p className="form-error" role="alert">{loginErrorMessage(login.error)}</p>}
        <button className="auth-submit" type="submit" disabled={login.isPending}>
          <span aria-hidden="true">▥</span>
          {login.isPending ? 'Abrindo o Estúdio…' : 'Entrar no Estúdio'}
          <span aria-hidden="true">→</span>
        </button>
      </form>
      <div className="auth-switch">
        <span>Ainda não possui sua bancada digital?</span>
        <Link to={{ pathname: '/cadastro', search: location.search }}>
          Crie sua conta em poucos minutos →
        </Link>
      </div>
    </div>
  )
}
