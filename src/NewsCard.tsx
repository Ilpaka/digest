import { tagsOf, type NewsItem } from './news'

const dateFormat = new Intl.DateTimeFormat('ru-RU', {
  day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Moscow',
})

export default function NewsCard({ item }: { item: NewsItem }) {
  return <article className="card">
    <div className="meta"><strong>{item.source}</strong><time dateTime={item.date}>{dateFormat.format(new Date(item.date))} МСК</time></div>
    <h2><a href={item.link} target="_blank" rel="noreferrer">{item.title}</a></h2>
    <p>{item.summary}</p>
    <div className="tags">{tagsOf(item).map((tag) => <span key={tag}>{tag}</span>)}</div>
  </article>
}
