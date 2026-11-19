import { render, screen, within } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import userEvent from '@testing-library/user-event'
import App from './App'

const old = { id: 'first', date: '2026-11-15T18:00:00Z', source: 'Редакция', title: 'Исследование телескопа', summary: 'Опубликована карта звёзд.', tags: 'наука, железо', link: 'https://example.org/first' }
const fresh = { ...old, id: 'second', date: '2026-11-16T09:00:00Z', title: 'Новая модель', summary: 'Нейросеть ускорила вычисления.', tags: 'ИИ, наука', link: 'https://example.org/second' }
function mockNews() {
  vi.stubGlobal('fetch', vi.fn().mockImplementation(async () => Response.json({ news: [old, fresh] })))
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

it('ищет в заголовке и пересказе без учёта регистра', async () => {
  mockNews(); render(<App />)
  const search = await screen.findByRole('searchbox', { name: 'Поиск по новостям' })
  const user = userEvent.setup()
  for (const word of ['ТЕЛЕСКОПА', 'кАрТа']) {
    await user.clear(search)
    await user.type(search, word)
    expect(screen.getAllByRole('article')).toHaveLength(1)
    expect(screen.getByRole('article')).toHaveTextContent(old.title)
  }
})
it('сочетает тег, поиск и фильтр непрочитанных', async () => {
  mockNews(); render(<App />)
  const user = userEvent.setup()
  await user.selectOptions(await screen.findByRole('combobox', { name: 'Тег' }), 'ИИ')
  await user.type(screen.getByRole('searchbox'), 'модель')
  expect(screen.getAllByRole('article')).toHaveLength(1)
  await user.click(screen.getByRole('checkbox', { name: 'Только непрочитанные' }))
  await user.click(screen.getByRole('button', { name: 'Отметить прочитанным' }))
  expect(screen.getByText('Новостей не найдено')).toBeVisible()
  await user.click(screen.getByRole('checkbox'))
  expect(screen.getByRole('article')).toHaveTextContent(fresh.title)
})

it('после повторного открытия восстанавливает отметку и позволяет её снять', async () => {
  mockNews()
  const user = userEvent.setup()
  const { unmount } = render(<App />)
  const buttons = await screen.findAllByRole('button', { name: 'Отметить прочитанным' })
  await user.click(buttons[0])
  expect(JSON.parse(localStorage.getItem('digest-read')!)).toEqual([fresh.id])

  unmount()
  render(<App />)
  const marked = await screen.findByRole('button', { name: 'Прочитано ✓', pressed: true })
  expect(marked.closest('article')).toHaveTextContent(fresh.title)
  await user.click(marked)
  expect(screen.getAllByRole('button', { pressed: false })).toHaveLength(2)
  expect(JSON.parse(localStorage.getItem('digest-read')!)).toEqual([])
})

it('позволяет читать новости при повреждённом значении в хранилище', async () => {
  mockNews()
  localStorage.setItem('digest-read', 'invalid')
  render(<App />)
  expect(await screen.findAllByRole('button', { pressed: false })).toHaveLength(2)
})
