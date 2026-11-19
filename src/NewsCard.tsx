import { tagsOf, type NewsItem } from './news'

const dateFormat = new Intl.DateTimeFormat('ru-RU', {
  day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Moscow',
})

type CardProps = {
  item: NewsItem
  read: boolean
  onToggle: () => void
}

export default function NewsCard({ item, read, onToggle }: CardProps) {
  return <article className={read ? "card read" : "card"}>
    <div className="meta"><strong>{item.source}</strong><time dateTime={item.date}>{dateFormat.format(new Date(item.date))} МСК</time></div>
    <h2><a href={item.link} target="_blank" rel="noreferrer">{item.title}</a></h2>
    <p>{item.summary}</p>
    <div className="tags">{tagsOf(item).map((tag) => <span key={tag}>{tag}</span>)}</div>
    <button type="button" aria-pressed={read} onClick={onToggle}>{read ? 'Прочитано ✓' : 'Отметить прочитанным'}</button>
  </article>
}
