export type NewsItem = {
  id: string
  date: string
  source: string
  title: string
  summary: string
  tags: string
  link: string
}

export function tagsOf(item: NewsItem) {
  return item.tags.split(',').map((tag) => tag.trim()).filter(Boolean)
}

function isNewsItem(value: unknown): value is NewsItem {
  if (!value || typeof value !== 'object') return false
  const item = value as Record<string, unknown>
  return ['id', 'date', 'source', 'title', 'summary', 'tags', 'link'].every((key) => typeof item[key] === 'string')
    && typeof item.link === 'string' && /^https?:\/\//i.test(item.link)
    && typeof item.date === 'string' && Number.isFinite(Date.parse(item.date))
}

export async function loadNews(url: string, signal: AbortSignal): Promise<NewsItem[]> {
  const response = await fetch(url, { signal })
  if (!response.ok) throw new Error(`Не удалось загрузить новости (HTTP ${response.status}).`)
  const data = await response.json()
  if (!Array.isArray(data?.news) || !data.news.every(isNewsItem)) {
    throw new Error('Источник вернул новости в неизвестном формате.')
  }
  return data.news.sort((a: NewsItem, b: NewsItem) => Date.parse(b.date) - Date.parse(a.date))
}
