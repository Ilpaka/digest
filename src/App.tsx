import { useEffect, useState } from 'react'
import NewsCard from './NewsCard'
import { loadNews, tagsOf, type NewsItem } from './news'

const endpoint = import.meta.env.VITE_DIGEST_URL?.trim()
const url = endpoint || `${import.meta.env.BASE_URL}data/news.json`

export default function App() {
  const [news, setNews] = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [query, setQuery] = useState('')
  const [tag, setTag] = useState('')
  const [unreadOnly, setUnreadOnly] = useState(false)
  const [read, setRead] = useState<Set<string>>(() => new Set())

  function toggleRead(id: string) {
    setRead((previous) => {
      const next = new Set(previous)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const tags = [...new Set(news.flatMap(tagsOf))].sort((a, b) => a.localeCompare(b, 'ru'))
  const needle = query.trim().toLocaleLowerCase('ru')
  const visible = news.filter((item) =>
    (!tag || tagsOf(item).includes(tag))
    && (!unreadOnly || !read.has(item.id))
    && (item.title.toLocaleLowerCase('ru').includes(needle) || item.summary.toLocaleLowerCase('ru').includes(needle)),
  )

  useEffect(() => {
    const controller = new AbortController()
    async function load() {
      try {
        const items = await loadNews(url, controller.signal)
        if (!controller.signal.aborted) setNews(items)
      } catch (e) {
        if (!controller.signal.aborted) setError(e instanceof Error ? e.message : 'Источник новостей недоступен.')
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }
    void load()
    return () => controller.abort()
  }, [])

  return <>
    <header><div className="wrap masthead"><h1>Дайджест новостей</h1><p>Технологии и наука</p></div></header>
    <main className="wrap">
      {!endpoint && <p className="edition">Сохранённый выпуск из RSS. Автоматическое обновление из Google Таблицы пока не подключено.</p>}
      {loading ? <p role="status">Загрузка новостей…</p> : error ? <p role="alert">{error}</p> :
        <>
          <div className="filters">
            <label>Поиск по новостям<input type="search" value={query} onChange={(e) => setQuery(e.target.value)} /></label>
            <label>Тег<select value={tag} onChange={(e) => setTag(e.target.value)}>
              <option value="">Все теги</option>
              {tags.map((value) => <option key={value}>{value}</option>)}
            </select></label>
            <label className="check"><input type="checkbox" checked={unreadOnly} onChange={(e) => setUnreadOnly(e.target.checked)} />Только непрочитанные</label>
          </div>
          <p className="count" role="status">Показано: {visible.length} из {news.length}</p>
          {visible.length ? <div className="feed">{visible.map((item) => (
            <NewsCard key={item.id} item={item} read={read.has(item.id)} onToggle={() => toggleRead(item.id)} />
          ))}</div> : <p>Новостей не найдено</p>}
        </>}
    </main>
  </>
}
