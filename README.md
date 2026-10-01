# Agenda+ Frontend

Interface web do Agenda+, uma aplicação para organizar serviços, profissionais e agendamentos de estúdios e casas de ofício.

## Demonstração online

- Aplicação: <https://agenda-plus-frontend-pearl.vercel.app>
- API: <https://agenda-plus-api-2nm8.onrender.com>
- Repositório: <https://github.com/SamuelIoranD/agenda-plus-frontend>

Como entrega adicional, a aplicação foi publicada na Vercel e está integrada à API online do projeto.

## O que a aplicação oferece

- Login e cadastro de administradores e clientes.
- Fluxo de reserva para clientes, com seleção de serviço, profissional, data e horário.
- Área do cliente com consulta dos próprios agendamentos.
- Painel administrativo com atendimentos de hoje e atendimentos futuros.
- Confirmação e cancelamento de agendamentos pelo administrador.
- Gerenciamento de serviços e profissionais.
- Agenda semanal para criação de reservas pelo administrador.
- Layout responsivo para desktop e celular.
- Rota SPA configurada para funcionar ao abrir URLs internas diretamente na Vercel.

## Stack

- React 19
- TypeScript
- Vite
- React Router
- TanStack Query
- Axios
- React Hook Form e Zod
- Zustand
- Tailwind CSS
- Vitest e Testing Library
- Oxlint
- Playwright

## Pré-requisitos

- Node.js compatível com o projeto, preferencialmente a versão LTS atual
- npm
- Backend do Agenda+ disponível localmente ou em produção
- Git

## Executando localmente

### 1. Baixe o projeto

```bash
git clone https://github.com/SamuelIoranD/agenda-plus-frontend.git
cd agenda-plus-frontend
```

### 2. Instale as dependências

```bash
npm install
```

### 3. Configure a API

Crie `.env.local` na raiz:

```dotenv
VITE_API_URL=http://localhost:8080
```

Durante o desenvolvimento, também é possível omitir `VITE_API_URL`: o Vite usa o proxy configurado em `vite.config.ts` e encaminha `/api` para `http://localhost:8080`, removendo o prefixo `/api`.

Para apontar a interface diretamente para a API publicada:

```dotenv
VITE_API_URL=https://agenda-plus-api-2nm8.onrender.com
```

`VITE_API_URL` é uma variável de build do Vite. Depois de alterá-la, reinicie o servidor de desenvolvimento ou gere uma nova compilação.

### 4. Inicie o servidor

```bash
npm run dev
```

Abra a URL exibida pelo Vite, normalmente <http://localhost:5173/login>.

## Scripts disponíveis

| Comando | Finalidade |
| --- | --- |
| `npm run dev` | Inicia o Vite com hot reload. |
| `npm run build` | Executa a checagem TypeScript e gera o build de produção. |
| `npm run preview` | Serve localmente o build gerado. |
| `npm run lint` | Executa o Oxlint. |
| `npm test` | Inicia o Vitest em modo interativo. |
| `npm run test:run` | Executa todos os testes uma vez. |
| `npm run check:responsive` | Executa as verificações automatizadas de responsividade. |

Antes de publicar uma alteração:

```bash
npm run lint
npm run test:run
npm run build
npm run check:responsive
```

## Fluxos de uso

### Administrador

1. Acesse `/cadastro` e escolha o cadastro de negócio.
2. Entre com as credenciais em `/login`.
3. Use `/painel` para visualizar atendimentos de hoje e futuros.
4. Confirme ou cancele agendamentos nos cartões correspondentes.
5. Use `/painel/agenda` para visualizar a agenda semanal e criar uma reserva.
6. Gerencie o catálogo em `/painel/servicos` e `/painel/profissionais`.

O cartão `Atendimentos futuros` usa a mesma apresentação e as mesmas ações de confirmação/cancelamento dos atendimentos do dia.

### Cliente

1. Acesse `/cadastro` e escolha o cadastro de cliente.
2. Entre com as credenciais em `/login`.
3. Acesse `/agendar` para escolher serviço, profissional, data e horário.
4. Consulte as reservas em `/meus-agendamentos`.

A área do cliente é somente para acompanhamento. O botão de cancelamento não é exibido para o cliente; o gerenciamento do status fica no painel administrativo.

## Rotas da aplicação

| Rota | Acesso | Descrição |
| --- | --- | --- |
| `/login` | Público | Login. |
| `/cadastro` | Público | Cadastro de cliente ou negócio. |
| `/agendar` | Cliente | Fluxo de reserva. |
| `/meus-agendamentos` | Cliente | Reservas do cliente autenticado. |
| `/painel` | Administrador | Resumo de atendimentos de hoje e futuros. |
| `/painel/agenda` | Administrador | Agenda semanal. |
| `/painel/profissionais` | Administrador | Gestão de profissionais. |
| `/painel/servicos` | Administrador | Gestão de serviços. |
| `/painel/agendamentos/novo` | Administrador | Criação de reserva para um cliente. |

Rotas desconhecidas redirecionam para `/login`.

## Autenticação e API

O cliente HTTP está em `src/services/api/client.ts`. Ele:

- usa `VITE_API_URL` como base da API;
- adiciona automaticamente `Authorization: Bearer <token>` às requisições;
- mantém o token no `localStorage` com a chave `agenda-plus:auth-token`;
- limpa a sessão quando a API retorna `401`.

As integrações são organizadas por contexto em `src/services/api`: autenticação, clientes, profissionais, serviços e agendamentos.

## Publicação

Como etapa adicional do projeto, o frontend foi publicado na Vercel com integração contínua ao repositório GitHub. O arquivo `vercel.json` mantém o funcionamento das rotas da SPA quando uma página interna é aberta diretamente:

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

Esse rewrite permite abrir e compartilhar rotas como `/login` e `/painel` sem perder a navegação do React Router.

## Integração com o backend

Em desenvolvimento, a combinação recomendada é:

```text
Frontend: http://localhost:5173
Backend:  http://localhost:8080
```

O backend precisa permitir a origem do frontend em `CORS_ALLOWED_ORIGINS`. Para produção, a origem deve incluir:

```text
https://agenda-plus-frontend-pearl.vercel.app
```

## Estrutura do projeto

```text
src/
├── components/       # componentes compartilhados e shells de layout
├── features/         # funcionalidades por domínio
│   ├── auth/
│   ├── client-booking/
│   ├── client-appointments/
│   ├── dashboard/
│   ├── professionals/
│   ├── scheduling/
│   └── services/
├── pages/            # páginas associadas às rotas
├── routes/           # composição e proteção das rotas
├── services/api/     # cliente HTTP e serviços de integração
├── store/            # estado persistido da sessão
├── styles/            # estilos globais e por página
└── types/             # tipos compartilhados do frontend

public/               # arquivos públicos
scripts/              # verificações auxiliares
vercel.json           # fallback de rotas da SPA
```

## Testes

Os testes unitários e de componentes usam Vitest, Testing Library e `jsdom`. Execute:

```bash
npm run test:run
```

As verificações de responsividade usam Playwright e podem exigir a instalação do navegador correspondente:

```bash
npx playwright install
npm run check:responsive
```

## Desenvolvimento

- Mantenha componentes e regras de negócio próximos ao contexto funcional correspondente.
- Prefira chamadas à API pelos módulos em `src/services/api`, evitando requisições espalhadas nas páginas.
- Atualize testes quando alterar rotas, autenticação ou regras de agendamento.
- Antes de enviar alterações, execute lint, testes, build e verificação responsiva.
