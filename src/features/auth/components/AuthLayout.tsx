import type { ReactNode } from 'react'

interface AuthLayoutProps {
  children: ReactNode
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <main className="auth-page">
      <div className="auth-shell">
        <section className="auth-editorial" aria-label="Sobre o Agenda+">
          <div className="auth-stamp" aria-hidden="true">
            <span>AGENDA+ · GESTÃO; ·</span>
          </div>
          <div className="auth-editorial-top">
            <div className="auth-brand" aria-label="Agenda+, Caderno de Ofício">
              <span>
                <strong>Agenda<span>+</span></strong>
                <small>CADERNO DE OFÍCIO</small>
              </span>
            </div>
            <div className="auth-audience">
              <span aria-hidden="true" />
              ATELIÊS &amp; CASAS DE OFÍCIO
            </div>
            <blockquote>“O tempo bem cuidado é a arte suprema do seu negócio.”</blockquote>
          </div>
          
        </section>
        <section className="auth-content">{children}</section>
      </div>
    </main>
  )
}
