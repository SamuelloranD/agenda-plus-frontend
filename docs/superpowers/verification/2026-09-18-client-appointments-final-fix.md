# Meus agendamentos — final fix verification

Date: 2026-09-18. Branch: `feat/client-appointments`. Starting commit: `a14e6a8`.

## Corrected behavior

- Login and client registration accept exact `/meus-agendamentos` as a safe `returnTo`. Registration defaults to CLIENTE for that destination. External URLs and non-exact appointment paths remain rejected; `/agendar` and its existing subpaths remain supported. ADMIN still goes to `/painel`.
- Backend no-offset LocalDateTime values are interpreted as UTC for the 24-hour cancellation boundary and upcoming/history classification. Display formatting preserves their date and wall-clock time independently of browser timezone and DST.
- Dialog cleanup restores focus to the original connected trigger, or to the stable, named page section if refetch removed the trigger. That section remains available for history, empty and error states. Keyboard trapping and Escape restoration remain covered.
- The list still requests individual pages and resolves service/professional names without exposing raw UUIDs.

## Automated verification complete

- `npm run test:run`: exit 0; 135 tests in 28 files passed.
- `npm run lint`: exit 0; no warnings or errors.
- `npm run build`: exit 0; TypeScript/Vite completed, 298 modules transformed.
- Focused tests ran in `America/Sao_Paulo` and `America/New_York`, including explicit UTC boundary instants and DST wall-clock preservation.
- Focus tests cover a removed trigger and a retained trigger. A separate integration test uses the real query/mutation hooks with the API simulated to verify cancellation, invalidation, refetch, updated status and connected focus together.

## Pending acceptance and warnings

Browser/manual acceptance remains pending: login/registration handoff, mobile layout, keyboard/screen-reader interaction, names, pagination and cancellation against the running backend. No manual browser validation or merge-readiness claim is made.

Build warning: the minified JavaScript chunk is 545.65 kB (164.49 kB gzip), above 500 kB. Vitest reports repeated jsdom setup as a performance recommendation. Neither failed verification.
