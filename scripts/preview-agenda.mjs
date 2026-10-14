import { chromium } from 'playwright'
const browser = await chromium.launch({ headless: true, executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' })
const professionals = ['André', 'José', 'Lucas'].map((nome, index) => ({ id: `p${index + 1}`, nome, especialidade: 'Barbeiro', ativo: true, horariosTrabalho: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'].map((diaSemana) => ({ diaSemana, inicio: '08:00:00', fim: '18:00:00' })) }))
const services = [{ id: 's1', nome: 'Barba', duracaoMinutos: 30, preco: { valor: 60, moeda: 'BRL' }, ativo: true }, { id: 's2', nome: 'Corte', duracaoMinutos: 45, preco: { valor: 40, moeda: 'BRL' }, ativo: true }]
const clients = ['Gabriel Silva', 'Samuel Oliveira', 'Pedro Santos'].map((nome, index) => ({ id: `c${index + 1}`, nome, email: `cliente${index + 1}@example.com`, role: 'CLIENTE' }))
const appointments = [
  { id: 'a1', inicio: '2026-10-14T08:00:00', fim: '2026-10-14T08:30:00', profissionalId: 'p1', clienteId: 'c1', servicoId: 's1', status: 'CONFIRMADO' },
  { id: 'a2', inicio: '2026-10-14T09:00:00', fim: '2026-10-14T09:45:00', profissionalId: 'p2', clienteId: 'c2', servicoId: 's2', status: 'PENDENTE' },
  { id: 'a3', inicio: '2026-10-14T09:00:00', fim: '2026-10-14T09:30:00', profissionalId: 'p3', clienteId: 'c3', servicoId: 's1', status: 'CONFIRMADO' },
  { id: 'a4', inicio: '2026-10-15T10:00:00', fim: '2026-10-15T10:30:00', profissionalId: 'p1', clienteId: 'c1', servicoId: 's1', status: 'CANCELADO' },
]
for (const width of [1440, 820, 390]) {
  const context = await browser.newContext({ viewport: { width, height: width === 390 ? 844 : 900 } })
  await context.addInitScript(() => localStorage.setItem('agenda-plus:auth-token', 'preview'))
  await context.route('**/api/**', async (route) => {
    const url = new URL(route.request().url())
    const path = url.pathname
    if (!path.startsWith('/api/')) return route.continue()
    const data = path === '/api/identity/me' ? { id: 'admin', nome: 'Admin Visual', email: 'admin@example.com', role: 'ADMIN' }
      : path === '/api/profissionais' ? professionals
        : path === '/api/servicos' ? services
          : path === '/api/clientes' ? clients
            : path === '/api/agendamentos' ? { conteudo: appointments.filter((item) => (!url.searchParams.get('profissionalId') || item.profissionalId === url.searchParams.get('profissionalId')) && item.inicio.slice(0, 10) >= (url.searchParams.get('dataInicio') ?? '') && item.inicio.slice(0, 10) <= (url.searchParams.get('dataFim') ?? '9999')), pagina: 0, tamanho: 100, totalPaginas: 1, totalElementos: appointments.length }
              : []
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(data) })
  })
  const page = await context.newPage()
  const errors = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()) })
  await page.goto('http://127.0.0.1:5173/painel/agenda?data=2026-10-14&visao=semana')
  await page.locator(width === 390 ? '.agenda-mobile-event' : '.agenda-event').first().waitFor()
  await page.screenshot({ path: `artifacts/agenda-week-${width}.png`, fullPage: true })
  await page.locator(width === 390 ? '.agenda-mobile-event' : '.agenda-event').first().click()
  await page.getByRole('dialog', { name: 'Detalhes do agendamento' }).waitFor()
  await page.getByRole('button', { name: 'Fechar painel' }).click()
  await page.getByRole('button', { name: 'Dia', exact: true }).click()
  await page.screenshot({ path: `artifacts/agenda-day-${width}.png`, fullPage: true })
  await page.getByRole('button', { name: 'Lista', exact: true }).click()
  await page.screenshot({ path: `artifacts/agenda-list-${width}.png`, fullPage: true })
  await page.getByRole('button', { name: /Novo agendamento/ }).first().click()
  await page.getByRole('dialog', { name: 'Novo agendamento' }).waitFor()
  await page.screenshot({ path: `artifacts/agenda-panel-${width}.png`, fullPage: true })
  await page.getByRole('combobox', { name: 'Cliente' }).click()
  await page.getByRole('option', { name: /Gabriel Silva/ }).click()
  await page.getByRole('button', { name: 'Fechar painel' }).click()
  await page.getByRole('alertdialog', { name: 'Descartar alterações?' }).waitFor()
  await page.getByRole('button', { name: 'Continuar editando' }).click()
  await page.getByRole('dialog', { name: 'Novo agendamento' }).waitFor()
  await page.getByRole('button', { name: 'Fechar painel' }).click()
  await page.getByRole('button', { name: 'Descartar alterações' }).click()
  const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth)
  if (errors.length || scrollWidth > width) throw new Error(JSON.stringify({ width, errors, scrollWidth }))
  console.log(JSON.stringify({ width, scrollWidth, errors }))
  await context.close()
}
await browser.close()
