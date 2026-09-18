# Checklist de verificacao - fluxo frontend

Data da verificacao: 2026-09-18

## Estado dos worktrees e ambiente

- [x] Frontend em `feat/frontend-flow`, worktree limpo e sincronizado com `origin/feat/frontend-flow` no commit `5ff2707`.
- [x] Backend em `master`, sincronizado com `origin/master` no commit `ba469c0`.
- [x] Postgres local iniciado via `docker compose up -d postgres`.
- [x] Backend iniciado com `mvn spring-boot:run` em `http://localhost:8080`.
- [x] Frontend iniciado com `npm run dev -- --host localhost` em `http://localhost:5173`.

## Verificacao automatizada

- [x] `npm run test:run` - 21 arquivos, 71 testes aprovados.
- [x] `npm run lint` - concluido sem erros.
- [x] `npm run build` - concluido sem erros TypeScript/Vite.
- [ ] O build emite apenas o aviso de chunk JavaScript acima de 500 kB; fica como melhoria de polimento/code splitting, sem bloquear a entrega.

## Smoke test dos fluxos principais

Os comandos abaixo foram executados contra o backend atualizado e os dados do
banco local:

- [x] `GET http://localhost:5173/agendar` retornou `200`.
- [x] `GET /servicos` e `GET /profissionais` sem JWT retornaram `200`.
- [x] O catalogo local continha o servico `Corte Classico` e o profissional `Mateus Silveira`.
- [x] Cadastro/login ADMIN e `GET /identity/me` retornaram `role=ADMIN`.
- [x] Cadastro/login CLIENTE e `GET /identity/me` retornaram `role=CLIENTE`.
- [x] Consulta de disponibilidade retornou 15 slots restantes em `2026-09-21`.
- [x] Criacao de agendamento autenticada retornou um novo id.
- [x] Repeticao do mesmo agendamento retornou `409`, confirmando o conflito de horario.
- [x] O agendamento criado apareceu na listagem administrativa por periodo/profissional.
- [x] CRUD de servico temporario: POST, PUT e DELETE retornaram 2xx.
- [x] CRUD de profissional temporario: POST, PUT e DELETE retornaram 2xx.

## Validacao visual/manual no navegador

- [ ] O servidor ficou disponivel para validacao manual em `http://localhost:5173`.
- [ ] A validacao visual interativa de todas as telas nao foi automatizada neste ambiente; os testes React e o smoke test HTTP cobrem o comportamento, mas a conferencia visual final deve ser feita no navegador.
- [ ] Fluxo ADMIN: login -> dashboard -> agenda -> novo agendamento.
- [ ] Fluxo de gestao: listagem/criacao/edicao/exclusao de profissionais e servicos.
- [ ] Fluxo CLIENTE: servico -> profissional especifico ou qualquer profissional -> horario -> cadastro/login -> confirmacao sem perder selecoes.
- [ ] Confirmacao exibe o profissional concreto atribuido.

## Limitacoes conhecidas do MVP

- Cliente nao possui suporte a walk-in: a confirmacao exige cadastro/login completo via `/auth/cadastro` ou login existente.
- A grade usa slots fixos derivados da duracao do servico; nao ha suporte a horarios intermediarios desalinhados.
- `Qualquer profissional` dispara N requisicoes de disponibilidade, uma por profissional cadastrado. Em escala maior, o backend deveria oferecer disponibilidade agregada.
- Na entrega original deste fluxo, `Meus agendamentos` ficou no backlog. A feature foi implementada depois em `feat/client-appointments`; as verificacoes automatizadas estao concluidas e o aceite manual em navegador permanece pendente. Veja a [verificacao da rodada final](2026-09-18-client-appointments-final-fix.md).
