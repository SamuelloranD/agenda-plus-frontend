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
            <span>AGENDA+ · GESTÃO &amp; CALMA ·</span>
          </div>
          <div className="auth-editorial-top">
            <div className="auth-brand" aria-label="Agenda+, Caderno de Ofício">
              <span className="auth-brand-icon" aria-hidden="true">▤</span>
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
            <cite>— Notas de Ateliê, Edição de Mestres</cite>
          </div>
          <div className="auth-editorial-bottom">
            <div className="auth-proof">
              <span className="auth-proof-mark" aria-hidden="true">A+</span>
              <span>
                <strong>Mais de 1.400 ateliês e estúdios</strong>
                <small>Organizam o fluxo diário com presença, clareza e tranquilidade.</small>
              </span>
            </div>
            <div className="auth-edition">
              <span>SISTEMA DE FLUXO CALMO</span>
              <span>VER. 4.2 · ATELIER EDITION</span>
            </div>
          </div>
        </section>
        <section className="auth-content">{children}</section>
      </div>
    </main>
  )
}
