import { chromium } from 'playwright'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'

const baseUrl = process.env.BOOKING_PREVIEW_URL ?? 'http://127.0.0.1:4173'
const outputDir = path.resolve('artifacts/booking-preview')
const service = { id: 's1', nome: 'Barba', duracaoMinutos: 30, preco: { valor: 60, moeda: 'BRL' } }
const services = [service, { id: 's2', nome: 'Corte', duracaoMinutos: 45, preco: { valor: 40, moeda: 'BRL' } }, { id: 's3', nome: 'Sobrancelha', duracaoMinutos: 15, preco: { valor: 20, moeda: 'BRL' } }]
const professional = { id: 'p1', nome: 'André', especialidade: 'Barbeiro', horariosTrabalho: [] }
const professionals = [professional, ...['José', 'Lucas', 'Thiago', 'Vinicius'].map((nome, index) => ({ id: `p${index + 2}`, nome, especialidade: 'Barbeiro', horariosTrabalho: [] }))]
const date = '2026-10-13'
const times = ['08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30']
const slots = times.map((time) => ({ inicio: `${date}T${time}:00`, fim: `${date}T${String(Number(time.slice(0, 2)) + (time.endsWith('30') ? 1 : 0)).padStart(2, '0')}:${time.endsWith('30') ? '00' : '30'}:00` }))
const chosen = slots[0]
const draft = { service, professionalChoice: 'p1', date, slot: { ...chosen, key: `${chosen.inicio}|${chosen.fim}`, candidates: [professional], profissionalId: 'p1' } }
let postCount = 0
const browser = await chromium.launch({ headless: true, executablePath: process.env.BOOKING_CHROME_PATH ?? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe' })
await mkdir(outputDir, { recursive: true })

for (const [width, height] of [[1672, 941], [1280, 800], [1024, 768], [768, 1024], [390, 844]]) {
  const context = await browser.newContext({ viewport: { width, height }, timezoneId: 'America/Sao_Paulo' })
  const page = await context.newPage()
  page.on('pageerror', (error) => console.error('page error:', error.message))
  page.on('console', (message) => { if (message.type() === 'error') console.error('console error:', message.text()) })
  await page.clock.install({ time: new Date('2026-10-13T07:00:00Z') })
  await page.addInitScript(({ token, selection }) => {
    localStorage.setItem('agenda-plus:auth-token', token)
    sessionStorage.setItem('agenda-plus:client-booking-draft', JSON.stringify(selection))
  }, { token: 'preview-client-token', selection: draft })
  await page.route('**/*', async (route) => {
    const url = new URL(route.request().url())
    if (!url.pathname.startsWith('/api/')) return route.continue()
    let body = []
    if (url.pathname.endsWith('/identity/me')) body = { id: 'c1', nome: 'Cliente Demo', email: 'cliente@example.test', role: 'CLIENTE' }
    else if (url.pathname.endsWith('/servicos')) body = services
    else if (url.pathname.endsWith('/profissionais')) body = professionals
    else if (url.pathname.endsWith('/horarios-disponiveis')) {
      if (url.searchParams.get('data') === '2026-10-15') return route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ message: 'Agenda temporariamente indisponível' }) })
      body = url.searchParams.get('data') === date ? slots : []
    }
    else if (url.pathname.endsWith('/agendamentos') && route.request().method() === 'POST') { postCount += 1; body = { id: 'preview-a1', ...await route.request().postDataJSON(), status: 'PENDENTE' } }
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) })
  })
  await page.goto(`${baseUrl}/agendar`)
  try { await page.getByRole('heading', { name: 'Escolha a data e o horário' }).waitFor({ timeout: 10000 }) }
  catch (error) { console.log(await page.locator('body').innerText()); await page.screenshot({ path: path.join(outputDir, `debug-${width}.png`) }); throw error }
  await page.getByRole('button', { name: /^13:30,/ }).waitFor()
  await page.screenshot({ path: path.join(outputDir, `booking-${width}x${height}.png`), fullPage: width < 600 })
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)
  console.log(`${width}x${height}: horizontal overflow=${overflow}`)
  if (width === 1672) {
    const previousDays = page.getByRole('button', { name: 'Mostrar dias anteriores' })
    if (await previousDays.isEnabled()) throw new Error('Seta anterior deveria iniciar desabilitada')
    await page.getByRole('button', { name: 'Mostrar próximos dias' }).click()
    if (!await previousDays.isEnabled()) throw new Error('Seta anterior não habilitou após avançar')
    await previousDays.click()
    if (await previousDays.isEnabled()) throw new Error('Seta anterior ultrapassou a data mínima')
    await page.getByRole('button', { name: 'Manhã' }).focus()
    await page.keyboard.press('Enter')
    if (await page.getByRole('button', { name: /^13:00,/ }).count()) throw new Error('Filtro Manhã mostrou horário da tarde')
    await page.getByRole('button', { name: 'Tarde' }).click()
    if (await page.getByRole('button', { name: /^09:00,/ }).count()) throw new Error('Filtro Tarde mostrou horário da manhã')
    await page.getByRole('button', { name: 'Todos', exact: true }).click()
    await page.getByRole('button', { name: /^10:00,/ }).click()
    await page.getByText('10:00', { exact: true }).count()
    await page.getByRole('button', { name: /Qua 14\/10/i }).click()
    if (await page.getByRole('button', { name: 'Solicitar agendamento' }).isEnabled()) throw new Error('Seleção antiga persistiu após mudar a data')
    await page.getByText(/Não há horários livres nesta data/).waitFor()
    await page.getByRole('button', { name: /Qui 15\/10/i }).click()
    await page.getByText(/Não foi possível consultar os horários desta data/).waitFor()
    await page.getByRole('button', { name: /Próximo horário disponível/ }).click()
    await page.getByText('Selecionado 13/10 às 08:00.').waitFor()
    if (!await page.getByRole('button', { name: 'Solicitar agendamento' }).isEnabled()) throw new Error('Atalho não selecionou um horário')
    await page.getByRole('button', { name: 'Editar' }).click()
    await page.getByRole('heading', { name: 'Escolha o serviço' }).waitFor()
    await page.locator('.booking-service-choice').first().click()
    await page.getByRole('button', { name: 'Escolher profissional' }).click()
    await page.getByRole('heading', { name: 'Escolha o profissional' }).waitFor()
    await page.locator('.booking-professional-choice').last().click()
    await page.getByRole('button', { name: 'Escolher data e horário' }).click()
    await page.getByRole('button', { name: /^09:00,/ }).click()
    await page.getByRole('button', { name: 'Solicitar agendamento' }).click()
    await page.getByRole('heading', { name: 'Aguardando confirmação do estabelecimento.' }).waitFor()
    await page.screenshot({ path: path.join(outputDir, 'booking-confirmation-1672x941.png') })
    if (postCount !== 1) throw new Error(`Envio duplicado: ${postCount} solicitações`)
    if (await page.getByRole('link', { name: 'Ver meus agendamentos' }).getAttribute('href') !== '/meus-agendamentos') throw new Error('Link de agendamentos incorreto')
    await page.getByRole('button', { name: 'Fazer outro agendamento' }).click()
    await page.locator('.booking-service-choice').first().click()
    await page.screenshot({ path: path.join(outputDir, 'booking-service-1672x941.png') })
    await page.getByRole('button', { name: 'Escolher profissional' }).click()
    await page.locator('.booking-professional-choice').first().click()
    await page.screenshot({ path: path.join(outputDir, 'booking-professional-1672x941.png') })
    console.log('desktop flow: filters, date reset, next availability, edit, pending submission passed')
  }
  if (width === 390) {
    if (!await page.getByRole('button', { name: 'Mostrar dias anteriores' }).isVisible()) throw new Error('Seta anterior não está visível no celular')
    if (!await page.getByRole('button', { name: 'Mostrar próximos dias' }).isVisible()) throw new Error('Seta seguinte não está visível no celular')
    await page.getByRole('button', { name: 'Abrir navegação' }).click()
    await page.getByRole('button', { name: 'Fechar navegação' }).click()
    await page.getByRole('button', { name: 'Solicitar agendamento' }).click()
    await page.getByRole('heading', { name: 'Aguardando confirmação do estabelecimento.' }).waitFor()
    await page.screenshot({ path: path.join(outputDir, 'booking-confirmation-390x844.png'), fullPage: true })
    await page.getByRole('button', { name: 'Fazer outro agendamento' }).click()
    await page.locator('.booking-service-choice').first().click()
    await page.screenshot({ path: path.join(outputDir, 'booking-service-390x844.png'), fullPage: true })
    await page.getByRole('button', { name: 'Escolher profissional' }).click()
    await page.locator('.booking-professional-choice').first().click()
    await page.screenshot({ path: path.join(outputDir, 'booking-professional-390x844.png'), fullPage: true })
    if (await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)) throw new Error('Fluxo móvel excedeu a largura da tela')
  }
  await context.close()
}
await browser.close()
