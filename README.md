# Agenda+ Frontend

Interface web do Agenda+, uma plataforma de gestão de estúdios e casas de ofício. A aplicação conecta a operação do negócio à experiência do cliente: apresenta o catálogo, conduz a reserva de um horário e organiza o acompanhamento dos atendimentos.

Este repositório representa a parte do projeto em que concentrei experiência de uso, arquitetura de frontend, integração com API, autenticação de sessão, responsividade e testes de interface.

## Demonstração online

- Aplicação: <https://agenda-plus-frontend-pearl.vercel.app>
- API consumida: <https://agenda-plus-api-2nm8.onrender.com>
- Repositório: <https://github.com/SamuelIoranD/agenda-plus-frontend>

Como entrega adicional, o frontend foi publicado na Vercel com integração ao repositório GitHub e conectado à API online do projeto.

## Visão do produto

O Agenda+ foi pensado para uma rotina em que o negócio precisa administrar serviços, profissionais e reservas, enquanto o cliente precisa encontrar um horário sem depender de troca de mensagens.

### Experiência do administrador

- painel com atendimentos de hoje;
- painel separado para atendimentos futuros;
- confirmação e cancelamento de reservas;
- agenda semanal;
- cadastro e manutenção de profissionais;
- cadastro e manutenção de serviços;
- criação de agendamento para um cliente.

### Experiência do cliente

- cadastro e login próprios;
- seleção de serviço;
- seleção de profissional;
- consulta de horários disponíveis;
- criação de reserva;
- consulta dos próprios agendamentos.

A interface diferencia os dois papéis por rotas protegidas e por shells de layout próprios, mantendo o foco de cada usuário na tarefa que precisa executar.

## Stack

| Área | Tecnologias |
| --- | --- |
| Interface | React 19 e TypeScript |
| Build | Vite |
| Rotas | React Router |
| Dados assíncronos | TanStack Query |
| HTTP | Axios |
| Formulários | React Hook Form e Zod |
| Estado de sessão | Zustand |
| Estilos | Tailwind CSS e CSS modular por contexto |
| Qualidade | Oxlint, Vitest e Testing Library |
| Responsividade | Playwright |
| Publicação | Vercel |

## Arquitetura por features

O projeto é organizado por domínio funcional, evitando que páginas e componentes de assuntos diferentes formem um único bloco difícil de evoluir.

```text
src/
├── features/
│   ├── auth/                 # login, cadastro e mensagens de autenticação
│   ├── client-booking/       # jornada de reserva do cliente
│   ├── client-appointments/  # acompanhamento do cliente
│   ├── dashboard/            # visão operacional do administrador
│   ├── professionals/        # gestão e apresentação de profissionais
│   ├── scheduling/           # criação e organização de reservas
│   └── services/             # gestão e apresentação de serviços
├── components/               # componentes compartilhados e layouts
├── pages/                    # composição das telas
├── routes/                   # rotas públicas e protegidas
├── services/api/             # integração HTTP por contexto
├── store/                    # estado persistido da sessão
├── styles/                   # linguagem visual e estilos de página
└── types/                    # contratos tipados da aplicação
```

Essa divisão aproxima componentes, hooks, schemas e testes da funcionalidade a que pertencem. As páginas ficam responsáveis por composição e os módulos de API concentram a comunicação com o backend.

## Fluxo de dados

```text
Página
  ↓
Hook da feature
  ↓
TanStack Query / mutation
  ↓
Módulo em services/api
  ↓
Axios com token JWT
  ↓
Agenda+ Backend
```

O TanStack Query controla carregamento, cache, refetch e invalidação. O Axios adiciona o token automaticamente e normaliza respostas de autenticação. O Zustand mantém a sessão entre navegações e limpa o token quando a API retorna `401`.

## Autenticação e autorização no cliente

O fluxo de sessão é centralizado no `authStore`:

1. O usuário envia e-mail e senha.
2. O frontend chama `/auth/login`.
3. O token é armazenado no `localStorage`.
4. O usuário atual é carregado por `/identity/me`.
5. O roteamento direciona administradores e clientes para suas respectivas áreas.
6. Uma resposta `401` remove a sessão e retorna o usuário para o login.

`ProtectedRoute` protege a área administrativa, enquanto `ClientRoute` limita as telas do cliente. A autorização visual acompanha a autorização do backend, sem tratar o frontend como a única camada de segurança.

## Decisões de interface

- A tela de login foi compactada para funcionar bem em celulares, sem criar uma etapa de rolagem desnecessária.
- O layout usa contraste, hierarquia tipográfica e espaçamento para separar operação de informação.
- O painel administrativo separa atendimentos de hoje e futuros, reduzindo ruído na rotina diária.
- O cliente acompanha seus agendamentos sem receber ações de gerenciamento que pertencem ao negócio.
- Estados de carregamento, erro e vazio são tratados pelas telas e componentes compartilhados.
- O fluxo de reserva é progressivo: serviço, profissional, data, horário e confirmação.
- A interface preserva o mesmo padrão visual em desktop e telas pequenas.

## Rotas principais

| Rota | Papel | Responsabilidade |
| --- | --- | --- |
| `/login` | Público | Login. |
| `/cadastro` | Público | Cadastro de cliente ou negócio. |
| `/agendar` | Cliente | Fluxo de reserva. |
| `/meus-agendamentos` | Cliente | Acompanhamento de reservas. |
| `/painel` | Administrador | Atendimentos de hoje e futuros. |
| `/painel/agenda` | Administrador | Agenda semanal. |
| `/painel/profissionais` | Administrador | Gestão de profissionais. |
| `/painel/servicos` | Administrador | Gestão de serviços. |
| `/painel/agendamentos/novo` | Administrador | Nova reserva para cliente. |

O `vercel.json` mantém o fallback para `index.html`, permitindo que rotas internas do React Router sejam abertas diretamente.

## Integração com a API

O endereço da API é configurado por `VITE_API_URL`:

```dotenv
VITE_API_URL=http://localhost:8080
```

No desenvolvimento, quando a variável não é definida, o Vite usa o proxy de `/api` para o backend local. Em produção, a aplicação usa a URL pública da API.

Os módulos em `src/services/api` agrupam os contratos de:

- autenticação;
- clientes;
- profissionais;
- serviços;
- agendamentos;
- horários disponíveis.

Os tipos TypeScript refletem as respostas e entradas esperadas pela API, reduzindo inconsistências entre formulário, estado e requisição.

## Testes e qualidade

Os testes de unidade e componentes utilizam Vitest, Testing Library e `jsdom`. Eles cobrem, entre outros pontos:

- proteção e redirecionamento de rotas;
- login, cadastro e tratamento de sessão;
- mensagens de erro da API;
- componentes de layout;
- fluxo de agendamento;
- renderização de estados vazios e de carregamento;
- regras de apresentação do painel.

Comandos principais:

```bash
npm run lint
npm run test:run
npm run build
npm run check:responsive
```

O build executa a checagem TypeScript antes de gerar os arquivos de produção. As verificações de responsividade usam Playwright para exercitar dimensões de tela importantes.

## Execução local

Pré-requisitos: Node.js LTS, npm e a API do Agenda+ disponível.

```bash
git clone https://github.com/SamuelIoranD/agenda-plus-frontend.git
cd agenda-plus-frontend
npm install
npm run dev
```

A aplicação normalmente fica disponível em `http://localhost:5173`. Para utilizar um backend local, o proxy do Vite aponta para `http://localhost:8080`. Para utilizar a API publicada, defina `VITE_API_URL` em `.env.local`.

## Estrutura de uma feature

Uma feature pode reunir seus próprios componentes, hooks, schemas, tipos e testes. Esse padrão mantém a regra de apresentação próxima do fluxo que a utiliza e evita componentes genéricos com responsabilidades demais.

```text
features/<contexto>/
├── components/   # partes visuais do contexto
├── hooks/         # leitura e mutações de dados
├── schemas/       # validação de formulários
└── *.test.tsx     # comportamento verificável
```

Componentes realmente compartilhados ficam em `src/components`, enquanto integrações HTTP permanecem em `src/services/api`.

## O que este projeto demonstra

- Construção de uma experiência completa para dois papéis de usuário.
- Organização de frontend por contexto funcional, e não apenas por tipo de arquivo.
- Uso de TypeScript para explicitar contratos entre telas, estado e API.
- Gerenciamento de dados assíncronos com cache e invalidação.
- Autenticação persistida e rotas protegidas.
- Integração real com backend Java/Spring e PostgreSQL.
- Tratamento de estados de carregamento, erro e ausência de dados.
- Atenção a responsividade e uso em celular.
- Testes automatizados de componentes, navegação e regras de interface.
- Publicação de uma aplicação funcional consumindo uma API online.
