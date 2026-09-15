# Semana 6 — Frontend: Fluxo Completo Implementation Design

## Objetivo

Entregar o frontend funcional do Agenda+ consumindo o backend existente: autenticação, painel administrativo, agenda semanal, criação de agendamento, gestão de profissionais e serviços e wizard público do cliente.

## Escopo confirmado

Esta entrega implementa somente as tarefas da Semana 6 do `documentos/PLANO_EXECUCAO.md`. Não serão criados novos endpoints de backend, métricas específicas, notificações reais, pagamentos ou funcionalidades de semanas futuras.

O fluxo do cliente exige cadastro ou login de uma conta CLIENTE antes da confirmação, porque o backend atual exige autenticação e `clienteId` para criar um agendamento. Essa é uma limitação conhecida do MVP: o cadastro completo com senha adiciona fricção em comparação com agendamento sem login. Um endpoint futuro de “agendamento rápido”/cliente simplificado fica fora deste escopo.

## Arquitetura

O frontend será organizado por feature, com uma camada compartilhada para transporte HTTP, autenticação e componentes de layout/UI. React Query será a fonte do estado do servidor; `useState` será reservado para estado efêmero de tela e o armazenamento local será usado apenas para o JWT e dados mínimos da sessão.

As rotas públicas serão login, cadastro e wizard do cliente. As rotas administrativas serão protegidas por um guard que verifica a sessão. O wizard poderá ser acessado sem JWT, mas exigirá autenticação CLIENTE no passo de confirmação; se a pessoa já possuir conta, verá uma opção clara de login em vez de ficar bloqueada por erro de e-mail duplicado.

## Contratos de API usados

- `POST /auth/login` com `{ email, senha }`, retornando `{ token, tokenType, expiresIn }`.
- `POST /auth/cadastro` com `{ nome, email, senha }`, retornando `{ id, nome, email, role }`.
- `POST /auth/cadastro-negocio` com `{ nome, email, senha }`, para cadastro ADMIN.
- `GET /identity/me`, retornando os dados da sessão autenticada.
- `GET /agendamentos?dataInicio&dataFim&profissionalId&pagina&tamanho`, retornando página com `conteudo`.
- `POST /agendamentos` com `{ inicio, fim, profissionalId, clienteId, servicoId }`.
- `GET /profissionais` e operações CRUD em `/profissionais/:id`.
- `GET /profissionais/:id/horarios-disponiveis?data&servicoId`.
- `GET /servicos` e operações CRUD em `/servicos/:id`.

Os tipos TypeScript desses contratos ficarão centralizados em `src/types`, sem shapes duplicados em hooks ou componentes.

## Organização de arquivos

- `src/services/api/client.ts`: instância Axios, base URL e interceptor de JWT.
- `src/services/api/auth.ts`, `scheduling.ts`, `professionals.ts`, `services.ts`: chamadas HTTP tipadas.
- `src/types/*.ts`: tipos de sessão, agendamento, profissional, serviço e erros.
- `src/features/*/hooks`: hooks React Query por domínio, reutilizáveis entre páginas.
- `src/features/*/components`: componentes de apresentação específicos da feature.
- `src/pages`: composição das telas e leitura de parâmetros de rota.
- `src/components/layout`: sidebar, header, shell protegido e estados comuns.
- `src/components/ui`: botão, campo, badge, card, modal e mensagens de estado reutilizáveis.
- `src/store/authStore.ts`: sessão JWT e usuário atual, com persistência mínima.
- `src/routes`: definição das rotas e guards.

## Fluxos

### Autenticação

Login envia credenciais, salva o token, busca `/identity/me` e redireciona ADMIN para o dashboard. Cadastro de negócio faz o mesmo após criar a conta. Cadastro de cliente pode ser usado no wizard. Falhas de credencial, validação e e-mail duplicado serão exibidas próximas ao formulário em linguagem amigável.

### Dashboard e agenda

`useAgendamentos` será o hook único para carregar agendamentos. O dashboard reaproveitará esse hook e derivará os cards de métricas e a lista do dia a partir dos dados obtidos, sem duplicar chamadas Axios. A agenda semanal usará o mesmo domínio, solicitando o intervalo da semana e agrupando os itens por dia/horário. O status e a cor visual serão mapeados em um único componente de badge/card.

### Novo agendamento

O formulário terá seleção de cliente, serviço, profissional, data e horário. O serviço selecionado determina a consulta de horários disponíveis. A validação local usará Zod; conflitos e demais erros da API serão mostrados no modal sem perder as escolhas já feitas. Após sucesso, a query de agendamentos será invalidada e a agenda/dashboard refletirão o novo registro.

### Gestão

Profissionais e serviços terão listagem, estado vazio, formulário de criação/edição, exclusão com confirmação e feedback de sucesso/erro. Os formulários seguirão os DTOs atuais do backend e não inventarão campos não suportados.

### Wizard do cliente

O wizard terá serviço → profissional → horário. “Qualquer profissional” será um modo agregado da interface, nunca um valor enviado ao backend: o frontend consultará `/profissionais` e, para cada profissional elegível, `/profissionais/{id}/horarios-disponiveis` para o serviço e a data escolhidos. Os horários serão agrupados; cada slot manterá a lista de profissionais candidatos. Quando a pessoa escolher um slot, o frontend fixará um candidato de forma determinística (a primeira opção na ordem da listagem) e exibirá o profissional atribuído no resumo. Assim, o `POST /agendamentos` sempre receberá um `profissionalId` real. Se a pessoa quiser controlar essa escolha, poderá selecionar um profissional específico antes de consultar os horários. Antes de criar o agendamento, a pessoa verá ações “Entrar” e “Criar conta”. Login ou cadastro de cliente salva a sessão, consulta `/identity/me`, obtém `clienteId` e retorna ao resumo sem reiniciar o wizard. A tela de confirmação exibirá os dados finais e o resultado da criação.

## Design visual

As telas seguirão as referências de `/design`: fundo off-white quente com textura pontilhada discreta, texto chumbo, terracota para CTA, oliva e mostarda para categorias/status, títulos serifados e labels em caixa alta com espaçamento. O painel usará sidebar e header semelhantes às referências de dashboard/agenda. O wizard seguirá a composição editorial da referência de agendamento do cliente, mantendo o resumo da reserva visível. Não serão adicionados gradientes genéricos, sombras pesadas ou componentes visualmente desconectados do sistema.

## Estados e erros

Cada consulta exibirá loading, erro, vazio e sucesso conforme aplicável. O cliente Axios normalizará respostas de erro para um tipo comum. Mensagens técnicas como conflito de horário serão traduzidas para mensagens acionáveis, por exemplo: “Este horário acabou de ser reservado. Escolha outro horário disponível.” Erros 401 limparão a sessão e redirecionarão para login, preservando a intenção de retorno quando possível.

## Validação

- `npm run build` deve concluir sem erros TypeScript/Vite.
- `npm run lint` deve concluir sem erros.
- Testes unitários de schemas, mapeamento de erros e derivação de métricas/agendamentos serão adicionados quando houver infraestrutura de testes adequada; componentes dependentes de browser serão validados pelo build e pelos fluxos manuais.
- Validação manual: login ADMIN → dashboard → agenda → novo agendamento → registro visível; cadastro/login CLIENTE → wizard completo → confirmação; tentativa de horário conflitante → mensagem amigável; listagem/criação/edição de profissionais e serviços.

## Limites e decisões

- O dashboard não criará endpoint novo: métricas serão derivadas da resposta de agendamentos.
- Não haverá fluxo anônimo de confirmação nesta semana.
- Não serão adicionados dados fictícios para mascarar ausência de resposta da API.
- O frontend não alterará contratos do backend nem implementará tarefas posteriores.
