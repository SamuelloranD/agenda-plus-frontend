import { chromium } from 'playwright'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'

const baseUrl = process.env.SIDEBAR_PREVIEW_URL ?? 'http://127.0.0.1:4173'
const outputDir = path.resolve('artifacts/sidebar-preview')
const browser = await chromium.launch({ headless: true, executablePath: process.env.BOOKING_CHROME_PATH ?? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe' })
await mkdir(outputDir, { recursive: true })

for (const [role, route, width, height] of [
  ['ADMIN', '/painel', 1440, 900],
  ['ADMIN', '/painel/agenda', 1440, 900],
  ['CLIENTE', '/meus-agendamentos', 1440, 900],
  ['CLIENTE', '/agendar', 1440, 900],
  ['ADMIN', '/painel', 390, 844],
  ['CLIENTE', '/meus-agendamentos', 390, 844],
]) {
  if (process.env.SIDEBAR_ONLY && `${role}:${route}:${width}` !== process.env.SIDEBAR_ONLY) continue
  const context = await browser.newContext({ viewport: { width, height } })
  const page = await context.newPage()
  page.on('pageerror', (error) => console.error(`${role} ${route} page error:`, error.message))
  page.on('console', (message) => { if (message.type() === 'error') console.error(`${role} ${route} console error:`, message.text()) })
  const token = role.toLowerCase()
  const user = { id: `${token}-1`, nome: role === 'ADMIN' ? 'João da Silva' : 'Ana Souza', email: `${token}@example.test`, role }
  await page.addInitScript((value) => localStorage.setItem('agenda-plus:auth-token', value), token)
  await page.route('**/*', async (requestRoute) => {
    const url = new URL(requestRoute.request().url())
    if (!url.pathname.startsWith('/api/')) return requestRoute.continue()
    let body = []
    if (url.pathname.endsWith('/identity/me')) body = user
    else if (url.pathname.endsWith('/agendamentos') || url.pathname.endsWith('/agendamentos/meus')) body = { conteudo: [], pagina: 0, tamanho: 20, totalElementos: 0, totalPaginas: 0 }
    await requestRoute.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) })
  })
  await page.goto(`${baseUrl}${route}`)
  const sidebar = page.locator(role === 'ADMIN' ? '#admin-sidebar' : '#client-sidebar')
  await sidebar.getByText(user.nome).waitFor()
  if (width < 1024) {
    await page.getByRole('button', { name: 'Abrir navegação' }).click()
    if (await sidebar.getAttribute('role') !== 'dialog') throw new Error(`${role}: menu móvel não é diálogo`)
    if (!await sidebar.getByRole('link', { name: 'Novo agendamento' }).evaluate((element) => element === document.activeElement)) throw new Error(`${role}: foco inicial ausente`)
    await page.waitForFunction((selector) => {
      const element = document.querySelector(selector)
      return element && Math.abs(element.getBoundingClientRect().left) < 1
    }, role === 'ADMIN' ? '#admin-sidebar' : '#client-sidebar')
  }
  const current = await sidebar.locator('[aria-current="page"]').allTextContents()
  console.log(`${role} ${route} ${width}px: item ativo=${current.join(', ') || 'nenhum'}`)
  const name = `${token}-${route.split('/').at(-1)}-${width}.png`
  await page.screenshot({ path: path.join(outputDir, name) })
  if (width < 1024) {
    await page.keyboard.press('Escape')
    if (await sidebar.getAttribute('role') === 'dialog') throw new Error(`${role}: Esc não fechou o diálogo`)
    await page.getByRole('button', { name: 'Abrir navegação' }).click()
    await sidebar.getByRole('link', { name: 'Novo agendamento' }).click()
    await page.waitForURL(role === 'ADMIN' ? '**/painel/agendamentos/novo' : '**/agendar')
    if (await sidebar.getAttribute('role') === 'dialog') throw new Error(`${role}: navegação não fechou o diálogo`)
  }
  if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)) throw new Error(`${role} ${width}px: rolagem horizontal`)
  await context.close()
}

await browser.close()
