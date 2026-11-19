import { render, screen, within } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import App from './App'

const old = { id: 'first', date: '2026-11-15T18:00:00Z', source: 'Редакция', title: 'Исследование телескопа', summary: 'Опубликована карта звёзд.', tags: 'наука, железо', link: 'https://example.org/first' }
const fresh = { ...old, id: 'second', date: '2026-11-16T09:00:00Z', title: 'Новая модель', summary: 'Нейросеть ускорила вычисления.', tags: 'ИИ, наука', link: 'https://example.org/second' }
function mockNews() {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ news: [old, fresh] })))
}
afterEach(() => { vi.unstubAllGlobals(); localStorage.clear() })

it('во время запроса сообщает о загрузке', () => {
  vi.stubGlobal('fetch', vi.fn(() => new Promise(() => {})))
  render(<App />)
  expect(screen.getByRole('status')).toHaveTextContent('Загрузка новостей')
})
it('показывает ошибку загрузки с HTTP-кодом', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 503 })))
  render(<App />)
  expect(await screen.findByRole('alert')).toHaveTextContent('HTTP 503')
})
it('сортирует по дате и показывает поля карточки', async () => {
  mockNews(); render(<App />)
  const [first, second] = await screen.findAllByRole('article')
  expect(within(first).getByRole('link', { name: fresh.title })).toHaveAttribute('href', fresh.link)
  expect(within(first).getByRole('link')).toHaveAttribute('target', '_blank')
  expect(first).toHaveTextContent(fresh.summary)
  expect(within(first).getByText('ИИ')).toBeVisible()
  expect(second).toHaveTextContent(old.title)
})
