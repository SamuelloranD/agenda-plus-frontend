import { chromium } from 'playwright'
const browser = await chromium.launch({ headless: true, executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' })
const services = [
  { id: 's1', nome: 'Barba', descricao: 'Serviço de barbearia tradicional.', duracaoMinutos: 30, preco: { valor: 60, moeda: 'BRL' }, ativo: true },
  { id: 's2', nome: 'Corte', descricao: 'Corte de cabelo masculino.', duracaoMinutos: 45, preco: { valor: 40, moeda: 'BRL' }, ativo: true },
  { id: 's3', nome: 'Sobrancelha', descricao: 'Design de sobrancelha.', duracaoMinutos: 15, preco: { valor: 20, moeda: 'BRL' }, ativo: false },
]
for (const width of [1440, 820, 390]) {
  const context = await browser.newContext({ viewport: { width, height: width === 390 ? 844 : 900 } })
  await context.addInitScript(() => localStorage.setItem('agenda-plus:auth-token', 'test-token'))
  await context.route('**/api/**', async (route) => {
    if (!['fetch', 'xhr'].includes(route.request().resourceType())) return route.continue()
    const path = new URL(route.request().url()).pathname
    const data = path === '/api/identity/me' ? { id: 'admin', nome: 'Admin Visual', email: 'admin@example.com', role: 'ADMIN' }
      : path === '/api/servicos' ? services
        : path.startsWith('/api/servicos/') ? services.find((service) => path.includes(service.id))
          : []
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(data) })
  })
  const page = await context.newPage()
  const errors = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto('http://127.0.0.1:5173/painel/servicos')
  await page.getByText('Barba').first().waitFor()
  await page.screenshot({ path: `artifacts/services-list-${width}.png`, fullPage: true })
  await page.getByRole('searchbox', { name: 'Buscar serviços' }).fill('SOBRANCELHA')
  await page.getByText('1 serviço encontrado').waitFor()
  await page.getByRole('searchbox', { name: 'Buscar serviços' }).fill('')
  await page.getByRole('button', { name: 'Ordenar por' }).click()
  await page.getByRole('button', { name: 'Nome (Z → A)' }).click()
  await page.locator('.services-card h3').first().getByText('Sobrancelha').waitFor()
  await page.getByRole('button', { name: 'Ordenar por' }).click()
  await page.getByRole('button', { name: 'Nome (A → Z)' }).click()
  await page.getByRole('button', { name: 'Editar serviço' }).first().click()
  await page.getByRole('dialog', { name: 'Editar serviço' }).waitFor()
  if (!page.url().includes('servico=s1')) throw new Error('Drawer URL does not contain the service ID')
  await page.screenshot({ path: `artifacts/services-drawer-${width}.png`, fullPage: true })
  const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth)
  if (errors.length || scrollWidth > width) throw new Error(JSON.stringify({ width, errors, scrollWidth }))
  console.log(JSON.stringify({ width, errors, scrollWidth }))
  await context.close()
}
await browser.close()
