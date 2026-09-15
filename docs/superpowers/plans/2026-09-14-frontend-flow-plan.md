# Frontend Flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the complete frontend flow described in the approved design, using the existing backend contracts and the Agenda+ visual system.

**Architecture:** Organize the app by feature with shared typed API services, React Query hooks, authentication state, protected admin routes, and reusable layout/UI primitives. Keep server state in React Query and derive dashboard/agenda views from the shared `useAgendamentos` hook.

**Tech Stack:** React 19, TypeScript, Vite, React Router, Axios, TanStack React Query, Zustand, React Hook Form, Zod, Tailwind CSS, Vitest.

**Spec:** `docs/superpowers/specs/2026-09-14-frontend-flow-design.md`

## Global Constraints

- Implement only the tasks listed in the Semana 6 section of `documentos/PLANO_EXECUCAO.md`.
- Do not add backend endpoints or alter backend contracts.
- Use the existing visual references in `/design`; preserve the warm off-white, terracotta, olive, mustard, serif-heading, editorial style.
- Reuse one `useAgendamentos` hook across dashboard, agenda, and post-mutation refreshes; do not duplicate Axios calls.
- Client confirmation requires a CLIENTE account, JWT, and `clienteId` from `/identity/me`.
- “Qualquer profissional” performs one availability request per listed professional and resolves each selected slot to a concrete `profissionalId`; record this N-request MVP limitation in the final summary.
- Use TDD for pure utilities, schemas, error mapping, and derived data before production implementation.

---

### Task 1: Frontend foundation, routing, and test harness

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `src/main.tsx`
- Modify: `src/index.css`
- Modify: `src/App.tsx`
- Create: `src/routes/AppRoutes.tsx`
- Create: `src/routes/ProtectedRoute.tsx`
- Create: `src/routes/ProtectedRoute.test.tsx`
- Create: `src/components/ui/LoadingState.tsx`
- Create: `src/components/ui/ErrorState.tsx`
- Create: `src/components/ui/EmptyState.tsx`
- Create: `vitest.config.ts`
- Create: `src/test/setup.ts`

**Interfaces:**
- `AppRoutes` mounts public routes `/login`, `/cadastro`, `/agendar/*` and protected routes `/painel`, `/painel/agenda`, `/painel/profissionais`, `/painel/servicos`, `/painel/agendamentos/novo`.
- `ProtectedRoute` renders children for an authenticated ADMIN and redirects otherwise.
- Shared state components receive `message?: string` and optional retry/action callbacks.

- [ ] **Step 1: Write the failing routing test**

Add a Vitest/React Testing Library test that renders the route table with no session and asserts a protected path redirects to `/login`.

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm run test:run -- src/routes/ProtectedRoute.test.tsx`

Expected: FAIL because React Router, the route table, and `ProtectedRoute` do not exist.

- [ ] **Step 3: Install the missing frontend dependencies and scripts**

Run: `npm install react-router-dom` and `npm install -D vitest jsdom @testing-library/react @testing-library/jest-dom`

Add scripts:

```json
"test": "vitest",
"test:run": "vitest run"
```

- [ ] **Step 4: Implement the route table and shared states**

Configure `QueryClientProvider` in `main.tsx`, mount `BrowserRouter`, implement the route guard, and replace the starter screen with the route shell. Keep existing CSS variables and extend them rather than introducing a generic theme.

- [ ] **Step 5: Run the focused test and foundation checks**

Run: `npm run test:run -- src/routes/ProtectedRoute.test.tsx`

Expected: PASS.

Run: `npm run build`

Expected: PASS with no TypeScript or Vite errors.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json src/main.tsx src/index.css src/App.tsx src/routes src/components/ui vitest.config.ts src/test
git commit -m "feat: configura base de rotas do frontend"
```

### Task 2: Typed API client and authentication session

**Files:**
- Create: `src/types/auth.ts`
- Create: `src/types/api.ts`
- Create: `src/services/api/client.ts`
- Create: `src/services/api/auth.ts`
- Create: `src/store/authStore.ts`
- Create: `src/features/auth/hooks/useSession.ts`
- Create: `src/features/auth/schemas/authSchemas.ts`
- Create: `src/features/auth/utils/authErrorMessage.ts`
- Create: `src/features/auth/utils/authErrorMessage.test.ts`
- Create: `src/features/auth/schemas/authSchemas.test.ts`

**Interfaces:**
- `authApi.login(input: LoginInput): Promise<AuthToken>`
- `authApi.registerClient(input: RegisterInput): Promise<User>`
- `authApi.registerBusiness(input: RegisterInput): Promise<User>`
- `authApi.me(): Promise<User>`
- `authStore`: `{ token: string | null; user: User | null; setSession; clearSession }`
- Axios interceptor reads the token from the store, and a 401 clears the store.

- [ ] **Step 1: Write failing error-mapping and schema tests**

Cover invalid credentials, duplicate e-mail, and generic API failures. Assert Zod rejects blank e-mail/password and accepts valid login data.

- [ ] **Step 2: Run focused tests to verify RED**

Run: `npm run test:run -- src/features/auth/utils/authErrorMessage.test.ts src/features/auth/schemas/authSchemas.test.ts`

Expected: FAIL because the mapper and schemas do not exist.

- [ ] **Step 3: Implement types, client, store, API functions, schemas, and mapper**

Use `localStorage` under a namespaced key for the token only. Keep user data in the store and refetch `/identity/me` on app startup when a token exists. Normalize ProblemDetail/API errors into `{ status?: number; message: string; code?: string }`.

- [ ] **Step 4: Run focused tests and build**

Run: `npm run test:run -- src/features/auth/utils/authErrorMessage.test.ts src/features/auth/schemas/authSchemas.test.ts`

Expected: PASS.

Run: `npm run build`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/types src/services/api/client.ts src/services/api/auth.ts src/store src/features/auth
git commit -m "feat: adiciona sessao e cliente api tipado"
```

### Task 3: Login and registration screens

**Files:**
- Create: `src/features/auth/components/AuthLayout.tsx`
- Create: `src/features/auth/components/LoginForm.tsx`
- Create: `src/features/auth/components/RegisterForm.tsx`
- Create: `src/features/auth/components/LoginForm.test.tsx`
- Create: `src/pages/LoginPage.tsx`
- Create: `src/pages/RegisterPage.tsx`
- Create: `src/features/auth/hooks/useAuthMutations.ts`
- Modify: `src/routes/AppRoutes.tsx`
- Modify: `src/index.css`

**Interfaces:**
- Login form submits `LoginInput` and redirects ADMIN to `/painel`.
- Register form supports `mode: 'client' | 'business'`; client mode returns to the pending wizard, business mode redirects to `/painel`.
- Both forms expose inline validation and friendly API errors.

- [ ] **Step 1: Write failing form/schema tests**

Assert that blank credentials render validation messages and that a successful mutation invokes the session setter with the returned token/user flow.

- [ ] **Step 2: Run focused tests to verify RED**

Run: `npm run test:run -- src/features/auth/components/LoginForm.test.tsx`

Expected: FAIL because the forms do not exist.

- [ ] **Step 3: Implement forms and auth layout**

Match the login reference: split editorial panel, serif heading, uppercase labels, terracotta CTA, subtle dot texture, responsive single-column layout. Do not add fake authentication features such as password recovery.

- [ ] **Step 4: Run tests and build**

Run: `npm run test:run -- src/features/auth`

Expected: PASS.

Run: `npm run build`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/auth src/pages/LoginPage.tsx src/pages/RegisterPage.tsx src/routes/AppRoutes.tsx src/index.css
git commit -m "feat: implementa telas de autenticacao"
```

### Task 4: Admin shell, shared domain types, and API hooks

**Files:**
- Create: `src/types/scheduling.ts`
- Create: `src/types/professionals.ts`
- Create: `src/types/services.ts`
- Create: `src/services/api/scheduling.ts`
- Create: `src/services/api/professionals.ts`
- Create: `src/services/api/services.ts`
- Create: `src/features/scheduling/hooks/useAgendamentos.ts`
- Create: `src/features/scheduling/hooks/useCreateAgendamento.ts`
- Create: `src/features/scheduling/hooks/useHorariosDisponiveis.ts`
- Create: `src/features/professionals/hooks/useProfessionals.ts`
- Create: `src/features/services/hooks/useServices.ts`
- Create: `src/components/layout/AdminShell.tsx`
- Create: `src/components/layout/Sidebar.tsx`
- Create: `src/components/layout/Header.tsx`
- Create: `src/components/ui/StatusBadge.tsx`
- Create: `src/components/ui/StatusBadge.test.tsx`

**Interfaces:**
- `useAgendamentos({ dataInicio, dataFim, profissionalId? })` returns the React Query result for the paginated response.
- `useHorariosDisponiveis({ profissionalId, data, servicoId })` is disabled until all three values exist.
- Mutation hooks invalidate `['agendamentos']`, `['profissionais']`, and `['servicos']` after success.

- [ ] **Step 1: Write failing tests for status mapping and shared query keys**

Assert each backend status maps to the correct visual token and that the agendamentos hook uses one stable query key for equivalent date ranges.

- [ ] **Step 2: Run focused tests to verify RED**

Run: `npm run test:run -- src/components/ui/StatusBadge.test.tsx`

Expected: FAIL because types, mapping, and hooks do not exist.

- [ ] **Step 3: Implement typed services, hooks, shell, and shared components**

Use one Axios method per backend operation. The shell must work at desktop width and collapse the sidebar on narrow screens while preserving navigation. Loading/error/empty states must be composable by pages.

- [ ] **Step 4: Run tests and build**

Run: `npm run test:run -- src/components/ui/StatusBadge.test.tsx`

Expected: PASS.

Run: `npm run build`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/types src/services/api src/features/scheduling/hooks src/features/professionals/hooks src/features/services/hooks src/components/layout src/components/ui/StatusBadge.tsx
git commit -m "feat: cria shell administrativo e hooks de dominio"
```

### Task 5: Dashboard and weekly agenda

**Files:**
- Create: `src/features/dashboard/utils/dashboardMetrics.ts`
- Create: `src/features/dashboard/utils/dashboardMetrics.test.ts`
- Create: `src/features/dashboard/components/MetricCard.tsx`
- Create: `src/features/dashboard/components/TodayAppointments.tsx`
- Create: `src/pages/DashboardPage.tsx`
- Create: `src/features/scheduling/components/WeeklyCalendar.tsx`
- Create: `src/features/scheduling/components/AppointmentCard.tsx`
- Create: `src/pages/WeeklyAgendaPage.tsx`
- Modify: `src/routes/AppRoutes.tsx`

**Interfaces:**
- `deriveDashboardMetrics(appointments, today)` returns counts for today, pending, confirmed, and cancelled items.
- Dashboard and agenda both call `useAgendamentos`; no page calls the Axios service directly.

- [ ] **Step 1: Write failing metric derivation tests**

Use fixture appointments with each status and assert the derived cards and today list contain only the expected items.

- [ ] **Step 2: Run focused tests to verify RED**

Run: `npm run test:run -- src/features/dashboard/utils/dashboardMetrics.test.ts`

Expected: FAIL because the derivation utility does not exist.

- [ ] **Step 3: Implement derivation and dashboard/agenda presentations**

Follow the dashboard and weekly agenda references: editorial headings, sidebar shell, terracotta action, olive/mustard status accents, left color rails on appointment cards, and grid cells for the weekly view. Use only real API data; show empty states when the API returns no appointments.

- [ ] **Step 4: Run tests and build**

Run: `npm run test:run -- src/features/dashboard/utils/dashboardMetrics.test.ts`

Expected: PASS.

Run: `npm run build`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/dashboard src/features/scheduling/components src/pages/DashboardPage.tsx src/pages/WeeklyAgendaPage.tsx src/routes/AppRoutes.tsx
git commit -m "feat: adiciona dashboard e agenda semanal"
```

### Task 6: New appointment modal and admin management screens

**Files:**
- Create: `src/features/scheduling/schemas/agendamentoSchema.ts`
- Create: `src/features/scheduling/schemas/agendamentoSchema.test.ts`
- Create: `src/features/scheduling/components/NewAppointmentForm.tsx`
- Create: `src/features/scheduling/components/NewAppointmentModal.tsx`
- Create: `src/pages/NewAppointmentPage.tsx`
- Create: `src/features/professionals/schemas/professionalSchema.ts`
- Create: `src/features/professionals/components/ProfessionalForm.tsx`
- Create: `src/features/professionals/components/ProfessionalList.tsx`
- Create: `src/pages/ProfessionalsPage.tsx`
- Create: `src/features/services/schemas/serviceSchema.ts`
- Create: `src/features/services/components/ServiceForm.tsx`
- Create: `src/features/services/components/ServiceList.tsx`
- Create: `src/pages/ServicesPage.tsx`
- Modify: `src/routes/AppRoutes.tsx`

**Interfaces:**
- `agendamentoSchema` validates future `inicio`, `fim`, UUID selections, and `fim > inicio`.
- `ProfessionalForm` sends the exact backend request shape, including at least one valid work interval.
- `ServiceForm` sends `{ nome, duracaoMinutos, preco: { valor, moeda } }`.

- [ ] **Step 1: Write failing schema tests**

Cover invalid past dates, end-before-start, missing IDs, invalid professional schedule, and invalid service price/duration.

- [ ] **Step 2: Run focused tests to verify RED**

Run: `npm run test:run -- src/features/scheduling/schemas/agendamentoSchema.test.ts`

Expected: FAIL because schemas do not exist.

- [ ] **Step 3: Implement schemas, forms, modal, lists, and pages**

Use dependent selects and `useHorariosDisponiveis` for the appointment form. On API conflict, preserve the form and show “Este horário acabou de ser reservado. Escolha outro horário disponível.” Management lists support create/edit/delete with confirmation and clear loading/error/empty states.

- [ ] **Step 4: Run tests and build**

Run: `npm run test:run -- src/features/scheduling/schemas/agendamentoSchema.test.ts`

Expected: PASS.

Run: `npm run build`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/scheduling/schemas src/features/scheduling/components src/pages/NewAppointmentPage.tsx src/features/professionals src/pages/ProfessionalsPage.tsx src/features/services src/pages/ServicesPage.tsx src/routes/AppRoutes.tsx
git commit -m "feat: adiciona agendamento e gestao do catalogo"
```

### Task 7: Client booking wizard and confirmation

**Files:**
- Create: `src/features/client-booking/types.ts`
- Create: `src/features/client-booking/utils/aggregateAvailability.ts`
- Create: `src/features/client-booking/utils/aggregateAvailability.test.ts`
- Create: `src/features/client-booking/hooks/useClientBooking.ts`
- Create: `src/features/client-booking/components/BookingStepper.tsx`
- Create: `src/features/client-booking/components/ServiceStep.tsx`
- Create: `src/features/client-booking/components/ProfessionalStep.tsx`
- Create: `src/features/client-booking/components/TimeStep.tsx`
- Create: `src/features/client-booking/components/BookingAuthPrompt.tsx`
- Create: `src/features/client-booking/components/BookingSummary.tsx`
- Create: `src/features/client-booking/components/BookingConfirmation.tsx`
- Create: `src/pages/ClientBookingPage.tsx`
- Modify: `src/routes/AppRoutes.tsx`

**Interfaces:**
- `aggregateAvailability(professionals, availabilityByProfessional)` returns slots keyed by ISO start/end, each with candidate professionals.
- `useClientBooking` preserves service/professional/date/time selections while auth occurs and exposes `confirmBooking()`.
- A chosen slot always contains a concrete `profissionalId` before the create mutation runs.

- [ ] **Step 1: Write failing availability aggregation tests**

Assert equal time slots merge candidate professionals, distinct slots remain separate, and an empty professional response yields no selectable slots.

- [ ] **Step 2: Run focused tests to verify RED**

Run: `npm run test:run -- src/features/client-booking/utils/aggregateAvailability.test.ts`

Expected: FAIL because the aggregation utility does not exist.

- [ ] **Step 3: Implement the wizard state and aggregate availability**

When “qualquer profissional” is selected, issue one React Query availability request per professional, aggregate results client-side, and assign the first candidate by list order when a slot is selected. When a specific professional is selected, issue only that professional’s request.

- [ ] **Step 4: Implement client auth handoff and confirmation**

Show login and create-account actions in the wizard. After either flow succeeds, call `/identity/me`, require `role === CLIENTE`, preserve the booking state, and create the appointment. If an ADMIN token is present, explain that a client account is required and offer to switch accounts.

- [ ] **Step 5: Implement the reference-aligned pages**

Use the customer booking reference: public header, three-step progress indicator, editorial cards, visible booking summary, terracotta confirmation CTA, and a confirmation view with date/time, service, and assigned professional.

- [ ] **Step 6: Run tests and build**

Run: `npm run test:run -- src/features/client-booking`

Expected: PASS.

Run: `npm run build`

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/features/client-booking src/pages/ClientBookingPage.tsx src/routes/AppRoutes.tsx
git commit -m "feat: implementa wizard de agendamento do cliente"
```

### Task 8: End-to-end polish, verification, and handoff

**Files:**
- Modify: `src/App.css`
- Modify: `src/index.css`
- Modify: `README.md` only if the existing frontend README needs the run instructions corrected
- Create: `docs/superpowers/verification/2026-09-14-frontend-flow-checklist.md`

- [ ] **Step 1: Run the full automated suite**

Run: `npm run test:run`

Expected: PASS.

Run: `npm run lint`

Expected: PASS with no errors.

Run: `npm run build`

Expected: PASS with no TypeScript/Vite errors.

- [ ] **Step 2: Run manual flow verification**

Start the backend and frontend using the project’s documented commands. Verify:

1. ADMIN login reaches dashboard.
2. Dashboard and agenda show API data and share the same query refresh after creating an appointment.
3. New appointment success appears in the agenda; a conflict shows a friendly message.
4. Professional and service list/create/edit/delete flows render loading, empty, error, and success states.
5. Client selects service → specific professional or “qualquer profissional” → date/time, logs in or registers as CLIENTE, and confirms without losing selections.
6. Confirmation displays the assigned concrete professional.

- [ ] **Step 3: Record verification evidence and known limitations**

Write the commands/results in the verification checklist, including the known MVP limitation that “qualquer profissional” creates N availability requests for N professionals. Note that an aggregated backend availability endpoint would be the future scaling improvement for dozens of professionals.

- [ ] **Step 4: Commit**

```bash
git add src/App.css src/index.css docs/superpowers/verification
git commit -m "chore: valida fluxo completo do frontend"
```
