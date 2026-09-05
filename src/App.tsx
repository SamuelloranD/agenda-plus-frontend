import './App.css'

function App() {
  return (
    <main className="atelier-page">
      <header className="topbar">
        <div className="brand-lockup" aria-label="Agenda+">
          <span className="brand-mark" aria-hidden="true"><span>+</span></span>
          <span className="brand-name">Agenda<span>+</span></span>
        </div>
        <span className="edition-label">VOLUME I · FOLHA 01</span>
      </header>
      <section className="welcome-sheet" aria-labelledby="welcome-title">
        <div className="sheet-copy">
          <p className="eyebrow">CADERNO DE ATENDIMENTO</p>
          <h1 id="welcome-title">Seu estúdio,<br /><em>no ritmo certo.</em></h1>
          <p className="intro">Uma agenda acolhedora para cuidar do seu negócio e deixar espaço para o que realmente importa: o seu ofício.</p>
          <div className="status-note"><span className="status-dot" /> Fundação em andamento</div>
        </div>
        <div className="stamp" aria-label="Agenda+ estúdio e gestão">
          <span>AGENDA+</span>
          <strong>ESTÚDIO<br />&amp; GESTÃO</strong>
          <small>DESDE · 2026</small>
        </div>
      </section>
      <footer className="page-footer">
        <span>ATELIÊ DE RESERVAS</span>
        <span className="footer-rule" />
        <span>ABRINDO AS PORTAS EM BREVE</span>
      </footer>
    </main>
  )
}

export default App
