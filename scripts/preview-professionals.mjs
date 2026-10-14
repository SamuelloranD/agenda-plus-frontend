import { chromium } from 'playwright'

const browser = await chromium.launch({ headless: true, executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' })
const people = ['André', 'José', 'Lucas', 'Thiago', 'Vinícius'].map((nome, index) => ({
  id: `person-${index + 1}`, nome, especialidade: 'Barbeiro', imagem: null, ativo: index !== 4,
  horariosTrabalho: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'].map((diaSemana) => ({ diaSemana, inicio: '08:00:00', fim: '20:00:00' })),
}))
for (const width of [1440, 390]) {
  const context = await browser.newContext({ viewport: { width, height: width === 390 ? 844 : 900 } })
  await context.addInitScript(() => localStorage.setItem('agenda-plus:auth-token', 'test-token'))
  await context.route('**/api/**', async (route) => {
    if (!['fetch', 'xhr'].includes(route.request().resourceType())) return route.continue()
    const path = new URL(route.request().url()).pathname
    const data = path === '/api/identity/me' ? { id: 'admin', nome: 'Admin Visual', email: 'admin@example.com', role: 'ADMIN' }
      : path === '/api/profissionais' ? people
        : path.startsWith('/api/profissionais/') ? people.find((person) => path.includes(person.id))
          : path.startsWith('/api/agendamentos') ? { conteudo: [], pagina: 0, tamanho: 100, totalElementos: 0, totalPaginas: 0 }
            : []
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(data) })
  })
  const page = await context.newPage()
  const errors = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto('http://127.0.0.1:5173/painel/profissionais')
  await page.getByRole('heading', { name: 'Profissionais', exact: true }).waitFor()
  await page.getByText('André').first().waitFor()
  await page.screenshot({ path: `artifacts/professionals-${width}.png`, fullPage: true })
  await page.getByRole('searchbox', { name: 'Buscar profissionais' }).fill('vinicius')
  await page.getByText('1 profissional', { exact: true }).waitFor()
  await page.getByRole('searchbox', { name: 'Buscar profissionais' }).fill('')
  await page.getByRole('button', { name: 'Ordenar por' }).click()
  await page.screenshot({ path: `artifacts/professionals-order-${width}.png`, fullPage: true })
  await page.getByRole('group', { name: 'Opções de ordenação' }).getByRole('button', { name: 'Nome (Z   A)' }).click()
  await page.locator('.professionals-card h3').first().getByText('Vinícius').waitFor()
  const firstName = await page.locator('.professionals-card h3').first().innerText()
  if (firstName !== 'Vinícius') throw new Error(`Unexpected order: ${firstName}`)
  await page.getByRole('button', { name: 'Ordenar por' }).click()
  await page.getByRole('group', { name: 'Opções de ordenação' }).getByRole('button', { name: 'Nome (A   Z)' }).click()
  if (width === 1440) {
    await page.getByRole('button', { name: 'Novo profissional' }).first().click()
    await page.getByRole('heading', { name: 'Novo profissional' }).waitFor()
    await page.screenshot({ path: 'artifacts/professional-editor-desktop.png', fullPage: true })
    await page.goto('http://127.0.0.1:5173/painel/profissionais/person-1/editar')
    await page.getByRole('heading', { name: 'Editar profissional' }).waitFor()
    await page.getByRole('textbox', { name: /Nome/ }).waitFor()
    await page.getByRole('button', { name: 'Copiar semana' }).click()
    await page.getByRole('button', { name: 'Dia de origem' }).click()
    await page.screenshot({ path: 'artifacts/professional-copy-source-1440.png', fullPage: true })
    await page.getByRole('button', { name: 'Dia de origem' }).press('Escape')
    await page.getByRole('button', { name: 'Fechar cópia de horários' }).click()
    await page.getByRole('textbox', { name: /Nome/ }).fill('André atualizado')
    await page.getByRole('link', { name: 'Voltar para profissionais' }).click()
    await page.getByRole('dialog', { name: 'Descartar alterações?' }).waitFor()
    await page.getByRole('button', { name: 'Continuar editando' }).click()
  } else {
    await page.getByRole('button', { name: 'Editar' }).first().click()
    await page.getByRole('heading', { name: 'Editar profissional' }).waitFor()
    await page.screenshot({ path: 'artifacts/professional-editor-mobile.png', fullPage: true })
    await page.getByRole('button', { name: 'Copiar semana' }).click()
    await page.getByRole('button', { name: 'Dia de origem' }).click()
    await page.screenshot({ path: 'artifacts/professional-copy-source-390.png', fullPage: true })
  }
  const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth)
  if (errors.length || scrollWidth > width) throw new Error(JSON.stringify({ width, errors, scrollWidth }))
  console.log(JSON.stringify({ width, errors, scrollWidth }))
  await context.close()
}
await browser.close()
