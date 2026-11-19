import { useEffect, useState } from 'react'
import NewsCard from './NewsCard'
import { loadNews, type NewsItem } from './news'

const endpoint = import.meta.env.VITE_DIGEST_URL?.trim()
const url = endpoint || `${import.meta.env.BASE_URL}data/news.json`

export default function App() {
  const [news, setNews] = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

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
        news.length ? <div className="feed">{news.map((item) => <NewsCard key={item.id} item={item} />)}</div> : <p>Новостей не найдено</p>}
    </main>
  </>
}
