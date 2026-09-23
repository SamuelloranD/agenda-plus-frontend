# Responsive Layout System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tornar toda a interface do Agenda+ responsiva para celulares, tablets, notebooks, desktops, ultrawide e 4K, incluindo alturas baixas e zoom de texto, sem alterar regras de negócio, estado, APIs ou rotas.

**Architecture:** Manter React, TypeScript, Vite e CSS existente. Centralizar tokens e regras responsivas em CSS compartilhado, migrando gradualmente os estilos inline por área. Usar mobile-first, containers limitados em telas grandes, drawer até tablet e scroll interno apenas onde o conteúdo realmente exige largura mínima, como o calendário.

**Tech Stack:** React 19, TypeScript, Vite, CSS global, Vitest, Testing Library.

**Spec:** Auditoria e complemento obrigatório aprovados pelo usuário na conversa de 2026-09-23.

## Global Constraints

- Não alterar regras de negócio, hooks de dados, chamadas de API, rotas ou contratos.
- Breakpoints canônicos: 480, 640, 768, 1024, 1280 e 1536px; regras de telas grandes em 1920, 2560 e 3840px.
- Manter a aparência de 2560x1440 como referência visual.
- Preservar sidebar mobile sem botão X, fechamento por toque fora, cores por profissional, cards simétricos e ícones Lucide.
- Inputs e controles touch devem ter pelo menos 44px de área; campos de texto devem usar pelo menos 16px.
- Nenhuma tela pode esconder conteúdo por falta de scroll vertical.
- Não fazer push.
- Commits pequenos, em português sem acentos, no formato `tipo: descricao`.

---

### Task 1: Fundação global, tokens e breakpoints

**Files:**
- Create: `src/styles/responsive.css`
- Modify: `src/main.tsx`
- Modify: `src/index.css`
- Test: `src/styles/responsive.test.ts`

**Interfaces:**
- Produces canonical CSS tokens for layout widths, safe areas, touch targets and documented breakpoint values.
- Produces global overflow/media/focus defaults consumed by every page.

- [ ] **Step 1: Write the failing CSS contract test**

  Add a Vitest test that reads `responsive.css` and asserts the presence of the canonical breakpoint markers, `min-height: 100svh`, safe-area variables, `overflow-x: clip`, media max-width rules and touch-target token.

- [ ] **Step 2: Run the focused test and verify it fails**

  Run: `npm test -- src/styles/responsive.test.ts --run`
  Expected: FAIL because `responsive.css` does not exist.

- [ ] **Step 3: Implement the foundation**

  Add `responsive.css` with `:root` tokens, canonical breakpoint comments, `html { font-size: 16px }`, safe-area helpers, `min-width: 0`/overflow guards, responsive media defaults and height-low media queries. Import it after `index.css` in `main.tsx`. Remove only conflicting global rules from `index.css`.

- [ ] **Step 4: Run focused checks**

  Run: `npm test -- src/styles/responsive.test.ts --run`
  Expected: PASS.

- [ ] **Step 5: Commit**

  Run: `git add src/styles/responsive.css src/styles/responsive.test.ts src/main.tsx src/index.css && git commit -m "feat: cria fundacao responsiva global"`

### Task 2: Shells, sidebar e header responsivos

**Files:**
- Modify: `src/components/layout/AdminShell.tsx`
- Modify: `src/components/layout/ClientShell.tsx`
- Modify: `src/components/layout/Header.tsx`
- Modify: `src/components/layout/Sidebar.tsx`
- Modify: `src/components/layout/ClientSidebar.tsx`
- Modify: `src/components/layout/AdminShell.test.tsx`
- Modify: `src/routes/ClientRoute.test.tsx`

**Interfaces:**
- Preserves existing shell state and callbacks.
- Header consumes the existing `sidebarOpen` value only to expose accurate `aria-expanded` and `aria-controls`.

- [ ] **Step 1: Add failing shell assertions**

  Extend existing shell tests to require the canonical tablet drawer breakpoint, safe-area padding, visible focus styles and accurate menu ARIA attributes.

- [ ] **Step 2: Run shell tests and verify failure**

  Run: `npm test -- src/components/layout/AdminShell.test.tsx src/routes/ClientRoute.test.tsx --run`
  Expected: FAIL against current `760px` CSS and hardcoded `aria-expanded="false"`.

- [ ] **Step 3: Consolidate shell CSS**

  Move duplicated shell rules into shared CSS loaded by `main.tsx`. Use the drawer at widths below `1024px`, preserve the existing overlay/touch-to-close behavior, add safe-area insets, prevent body/page horizontal overflow and allow vertical scrolling in all shell states. Remove the duplicated style strings from both shell components without changing their state logic.

- [ ] **Step 4: Make menu semantics accurate**

  Keep the existing menu behavior, add a stable menu id, pass `aria-expanded={sidebarOpen}` and `aria-controls`, and keep the trigger usable while the drawer is open unless the existing interaction requires otherwise.

- [ ] **Step 5: Verify shell tests**

  Run: `npm test -- src/components/layout/AdminShell.test.tsx src/routes/ClientRoute.test.tsx --run`
  Expected: PASS.

- [ ] **Step 6: Commit**

  Run: `git add src/components/layout src/routes/ClientRoute.test.tsx && git commit -m "feat: adapta shells e navegacao para tablets"`

### Task 3: Inputs, selects, date picker e alvos touch

**Files:**
- Modify: `src/index.css`
- Modify: `src/components/ui/Select.tsx`
- Modify: `src/components/ui/DatePicker.tsx`
- Modify: `src/features/auth/components/LoginForm.tsx`
- Modify: `src/features/auth/components/RegisterForm.tsx`
- Test: `src/components/ui/Select.test.tsx`
- Test: `src/components/ui/DatePicker.test.tsx`

**Interfaces:**
- No change to component props or selected values.
- Popovers remain anchored to their existing controls and close behavior.

- [ ] **Step 1: Add failing interaction-size/viewport tests**

  Add assertions for 44px minimum interactive controls, focusable popover controls, and responsive date-picker/select class contracts without changing component APIs.

- [ ] **Step 2: Run focused tests and verify failure**

  Run: `npm test -- src/components/ui/Select.test.tsx src/components/ui/DatePicker.test.tsx --run`
  Expected: FAIL against current 32px date-picker buttons and 32px password toggle.

- [ ] **Step 3: Implement controls**

  Use `min-height: 44px`, `min-width: 44px`, `font-size: 16px` for text-entry controls, `width: min(286px, calc(100vw - 32px))` for the calendar popover, viewport-safe positioning, internal scrolling and safe-area padding. Preserve keyboard behavior and existing data values.

- [ ] **Step 4: Verify focused tests**

  Run: `npm test -- src/components/ui/Select.test.tsx src/components/ui/DatePicker.test.tsx --run`
  Expected: PASS.

- [ ] **Step 5: Commit**

  Run: `git add src/index.css src/components/ui src/features/auth/components && git commit -m "feat: melhora controles e alvos de toque"`

### Task 4: Auth, dashboard, catálogos e novo agendamento

**Files:**
- Modify: `src/index.css`
- Modify: `src/pages/DashboardPage.tsx`
- Modify: `src/pages/ServicesPage.tsx`
- Modify: `src/pages/ProfessionalsPage.tsx`
- Modify: `src/pages/NewAppointmentPage.tsx`
- Modify: `src/features/client-booking/components/BookingStepper.tsx`
- Test: existing page/component tests covering these areas.

**Interfaces:**
- No changes to form values, mutation callbacks or page routes.

- [ ] **Step 1: Add failing responsive contracts for page classes**

  Add focused tests for removal of tablet `nowrap`, stacked form actions, fluid card grids and height-low compact rules.

- [ ] **Step 2: Run focused tests and verify failure**

  Run the affected Vitest files with `--run` and confirm the current CSS contracts fail.

- [ ] **Step 3: Implement mobile-first page layouts**

  Consolidate each page’s inline styles one component at a time. Replace rigid grids with `auto-fit/minmax`, stack actions where required, keep content containers capped and add `max-height` compact rules for `<=800px` and `<=600px`. Remove `white-space: nowrap` from headings that can wrap.

- [ ] **Step 4: Verify affected tests, lint and build**

  Run: `npm run lint; npm run build; npm run test:run`
  Expected: exit 0 and all existing tests pass.

- [ ] **Step 5: Commit**

  Run: `git add src/index.css src/pages src/features/client-booking/components/BookingStepper.tsx && git commit -m "feat: adapta formularios e paineis"`

### Task 5: Agenda semanal, booking, cards de cliente e modais

**Files:**
- Modify: `src/pages/WeeklyAgendaPage.tsx`
- Modify: `src/features/scheduling/components/WeeklyCalendar.tsx`
- Modify: `src/features/scheduling/components/AppointmentCard.tsx`
- Modify: `src/features/scheduling/components/AppointmentActions.tsx`
- Modify: `src/pages/ClientBookingPage.tsx`
- Modify: `src/features/client-booking/components/BookingSummary.tsx`
- Modify: `src/features/client-booking/components/BookingAuthPrompt.tsx`
- Modify: `src/features/client-booking/components/BookingConfirmation.tsx`
- Modify: `src/pages/ClientAppointmentsPage.tsx`
- Modify: `src/features/client-appointments/components/ClientAppointmentCard.tsx`
- Modify: `src/features/client-appointments/components/CancelAppointmentDialog.tsx`

**Interfaces:**
- Calendar retains its existing seven-day data model and inline column calculation, but its scroll container becomes the only horizontal overflow surface.
- Booking retains all selection and confirmation callbacks.

- [ ] **Step 1: Add failing layout contracts**

  Add tests for calendar scroll containment, compact booking behavior, stacked client cards and modal max-height/safe-area rules.

- [ ] **Step 2: Run focused tests and verify failure**

  Run the affected tests with `--run` and confirm current fixed widths/height rules fail.

- [ ] **Step 3: Implement calendar containment**

  Add `max-width: 100%`, `overflow-x: auto`, `overscroll-behavior-x: contain`, focus-visible styling and maintain the 1160px internal canvas. Increase action target sizes without changing appointment actions.

- [ ] **Step 4: Implement booking height and width rules**

  Remove unsafe `height: 100dvh`/`overflow: hidden` combinations where content can grow, use `min-height`, make the sidebar stack at tablet widths, preserve the desktop composition above `1024px`, and add compact rules for low-height landscape screens.

- [ ] **Step 5: Implement cards and modal rules**

  Use fluid card columns, wrap status content, stack modal footer buttons on narrow screens, apply safe-area padding and viewport-relative max heights.

- [ ] **Step 6: Verify affected tests, lint and build**

  Run: `npm run lint; npm run build; npm run test:run`
  Expected: exit 0 and all tests pass.

- [ ] **Step 7: Commit**

  Run: `git add src/pages src/features/scheduling src/features/client-booking src/features/client-appointments && git commit -m "feat: adapta agenda booking e modais"`

### Task 6: Escala de telas grandes e remoção isolada do CSS legado

**Files:**
- Modify: `src/index.css`
- Delete: `src/App.css`
- Modify: `src/main.tsx` only if an import is found during the final reference scan.

**Interfaces:**
- No runtime or route changes.

- [ ] **Step 1: Prove App.css is unused**

  Run: `rg -n "App\.css|atelier-page|#next-steps|#center" src index.html *.html -g '!node_modules'` and confirm there are no imports or test references.

- [ ] **Step 2: Add large-screen rules**

  Cap main containers in rem-based widths, keep 16px root sizing through 2559px, add controlled root scaling at 2560px and 3840px only after visual verification, and prevent grids from producing oversized cards.

- [ ] **Step 3: Remove App.css only after the reference scan**

  Delete the unused file with `apply_patch` and verify the build output remains unchanged except for expected CSS cleanup.

- [ ] **Step 4: Run lint, build and tests**

  Run: `npm run lint; npm run build; npm run test:run`
  Expected: exit 0 and all tests pass.

- [ ] **Step 5: Commit separately**

  Run: `git add src/index.css && git commit -m "feat: limita escala em telas grandes"`; then `git add -u src/App.css && git commit -m "chore: remove css legado nao utilizado"`.

### Task 7: Viewport verification and handoff

**Files:**
- Modify only if verification exposes a responsive regression.

- [ ] **Step 1: Start the production preview or dev server**

  Use the existing Vite scripts without adding dependencies.

- [ ] **Step 2: Verify all target widths/heights**

  Check 320, 360, 375, 390, 414, 768, 820, 1024, 1280, 1440, 1920, 2560 and 3840px, including portrait/landscape mobile/tablet and heights 360–420, 600, 720, 768, 864, 1080 and 1440px where applicable.

- [ ] **Step 3: Verify zoom-sensitive layouts**

  Validate the low-height/FHD targets at 100%, 125% and 150% zoom equivalents, checking horizontal overflow, clipped content, overlaps and focus order.

- [ ] **Step 4: Run final verification**

  Run: `npm run lint; npm run build; npm run test:run`
  Expected: exit 0, all tests pass, and any build warning is documented rather than attributed to this work.

- [ ] **Step 5: Report**

  Summarize changes by file, list canonical breakpoints and separate width, low-height and large-screen adjustments. Document unresolved items and the separate `App.css` removal commit.
