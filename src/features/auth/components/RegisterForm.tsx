import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import type { ZodType } from 'zod'
import type { ApiError } from '../../../types/api'
import type { RegisterInput } from '../../../types/auth'
import { getPendingReturnPath, RegistrationSessionError, useRegisterMutation, type RegistrationMode } from '../hooks/useAuthMutations'
import { registerSchema } from '../schemas/authSchemas'

function registerErrorMessage(error: unknown) {
  const apiError = error as ApiError | undefined
  if (apiError?.status === 409 || apiError?.code === 'EMAIL_ALREADY_EXISTS') {
    return 'Este e-mail já está cadastrado. Entre na sua conta ou use outro e-mail.'
  }

  return apiError?.message ?? 'Não foi possível criar a conta agora. Tente novamente.'
}

export function RegisterForm() {
  const location = useLocation()
  const [mode, setMode] = useState<RegistrationMode>(() => getPendingReturnPath(location.search) ? 'client' : 'business')
  const navigate = useNavigate()
  const registration = useRegisterMutation(mode)
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema as ZodType<RegisterInput, RegisterInput>),
    defaultValues: { nome: '', email: '', senha: '' },
  })

  const onSubmit = handleSubmit(async (input) => {
    try {
      await registration.mutateAsync(input)
      const returnTo = getPendingReturnPath(location.search)
      const hasReturnTo = new URLSearchParams(location.search).has('returnTo')
      navigate(mode === 'client' ? returnTo ?? (hasReturnTo ? '/agendar' : '/meus-agendamentos') : '/painel', { replace: true })
    } catch {
      // React Query exposes the normalized failure beside the form.
    }
  })

  return (
    <div className="auth-form-wrap">
      <div className="auth-meta">
        <span>NOVA CONTA</span>
        <span className="auth-secure"><i aria-hidden="true" /> DADOS PROTEGIDOS</span>
      </div>
      <header className="auth-form-header">
        <h1>Abra sua Agenda</h1>
        <p>Escolha o tipo de conta e comece com os dados essenciais.</p>
      </header>
      <fieldset className="account-modes">
        <legend>TIPO DE CONTA</legend>
        <label className={mode === 'business' ? 'selected' : ''}>
          <input
            type="radio"
            name="registration-mode"
            value="business"
            checked={mode === 'business'}
            onChange={() => setMode('business')}
          />
          Negócio
        </label>
        <label className={mode === 'client' ? 'selected' : ''}>
          <input
            type="radio"
            name="registration-mode"
            value="client"
            checked={mode === 'client'}
            onChange={() => setMode('client')}
          />
          Cliente
        </label>
      </fieldset>
      <form className="auth-form" onSubmit={onSubmit} noValidate>
        <div className="auth-field">
          <label htmlFor="register-name">NOME</label>
          <input
            id="register-name"
            autoComplete="name"
            placeholder={mode === 'business' ? 'Nome do seu negócio' : 'Seu nome completo'}
            aria-invalid={Boolean(errors.nome)}
            aria-describedby={errors.nome ? 'register-name-error' : undefined}
            {...register('nome')}
          />
          {errors.nome && <span className="field-error" id="register-name-error">{errors.nome.message}</span>}
        </div>
        <div className="auth-field">
          <label htmlFor="register-email">E-MAIL</label>
          <input
            id="register-email"
            type="email"
            autoComplete="email"
            placeholder="voce@exemplo.com.br"
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? 'register-email-error' : undefined}
            {...register('email')}
          />
          {errors.email && <span className="field-error" id="register-email-error">{errors.email.message}</span>}
        </div>
        <div className="auth-field">
          <label htmlFor="register-password">SENHA</label>
          <input
            id="register-password"
            type="password"
            autoComplete="new-password"
            placeholder="Crie uma chave segura"
            aria-invalid={Boolean(errors.senha)}
            aria-describedby={errors.senha ? 'register-password-error' : undefined}
            {...register('senha')}
          />
          {errors.senha && <span className="field-error" id="register-password-error">{errors.senha.message}</span>}
        </div>
        {registration.isError && (
          registration.error instanceof RegistrationSessionError ? (
            <div className="form-error" role="alert">
              <p>Sua conta foi criada, mas não foi possível entrar automaticamente.</p>
              <Link to={{ pathname: '/login', search: location.search }}>Entre com seus dados →</Link>
            </div>
          ) : <p className="form-error" role="alert">{registerErrorMessage(registration.error)}</p>
        )}
        <button className="auth-submit" type="submit" disabled={registration.isPending}>
          {registration.isPending ? 'Preparando sua agenda…' : 'Criar conta'}
          <span aria-hidden="true">→</span>
        </button>
      </form>
      <div className="auth-switch">
        <span>Já possui uma conta?</span>
        <Link to={{ pathname: '/login', search: location.search }}>Entre no Estúdio →</Link>
      </div>
    </div>
  )
}
