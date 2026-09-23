import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { useState } from 'react'
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
  const [showPassword, setShowPassword] = useState(false)
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
      const hasReturnTo = new URLSearchParams(location.search).has('returnTo')
      navigate(user.role === 'ADMIN' ? '/painel' : returnTo ?? (hasReturnTo ? '/agendar' : '/meus-agendamentos'), { replace: true })
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
          <div className="password-input-wrap">
            <input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="••••••••••••"
              aria-invalid={Boolean(errors.senha)}
              aria-describedby={errors.senha ? 'login-password-error' : undefined}
              {...register('senha')}
            />
            <button
              className="password-visibility-toggle"
              type="button"
              aria-label={showPassword ? 'Ocultar caracteres' : 'Mostrar caracteres'}
              onClick={() => setShowPassword((visible) => !visible)}
            >
              {showPassword ? <EyeOff aria-hidden="true" size={18} /> : <Eye aria-hidden="true" size={18} />}
            </button>
          </div>
          {errors.senha && <span className="field-error" id="login-password-error">{errors.senha.message}</span>}
        </div>
        {login.isError && <p className="form-error" role="alert">{loginErrorMessage(login.error)}</p>}
        <button className="auth-submit" type="submit" disabled={login.isPending}>
          {login.isPending ? 'Abrindo o Estúdio…' : 'Entrar no Estúdio'}
        </button>
      </form>
      <div className="auth-switch">
        <span>Ainda não possui sua bancada digital?</span>
        <Link to={{ pathname: '/cadastro', search: location.search }}>
          Crie sua conta em poucos minutos
        </Link>
      </div>
    </div>
  )
}
