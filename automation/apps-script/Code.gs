/** @OnlyCurrentDoc */

const SHEET = 'news'
const HEADERS = ['id', 'date', 'source', 'title', 'summary', 'tags', 'link']

function doGet() {
  const sheet = SpreadsheetApp.getActive().getSheetByName(SHEET)
  const [head, ...rows] = sheet.getDataRange().getValues()
  if (HEADERS.some((name, i) => name !== head[i])) return json({ error: 'Проверьте заголовки листа news' })
  const news = rows.filter((row) => row[0]).map((row) =>
    Object.fromEntries(HEADERS.map((name, i) => [name, row[i]])))
  return json({ news })
}

function doPost(e) {
  const body = JSON.parse(e.postData.contents)
  const key = PropertiesService.getScriptProperties().getProperty('KEY')
  if (!key || body.key !== key) return json({ error: 'Неверный ключ' })
  if (!Array.isArray(body.news)) return json({ error: 'Ожидается массив news' })

  const lock = LockService.getScriptLock()
  lock.waitLock(30000)
  try {
    const sheet = SpreadsheetApp.getActive().getSheetByName(SHEET)
    const [header, ...rows] = sheet.getDataRange().getValues()
    if (HEADERS.some((name, i) => name !== header[i])) return json({ error: 'Проверьте заголовки листа news' })
    const known = new Set(rows.map((row) => row[0]))
    const fresh = []
    for (const item of body.news) {
      if (!item.id || known.has(item.id)) continue
      const row = HEADERS.map((name) => {
        const value = name === 'tags' ? item.tags.join(', ') : String(item[name])
        return /^[=+@-]/.test(value) ? "'" + value : value
      })
      fresh.push(row)
      known.add(item.id)
    }
    if (fresh.length) {
      sheet.getRange(sheet.getLastRow() + 1, 1, fresh.length, HEADERS.length).setValues(fresh)
      SpreadsheetApp.flush()
    }
    return json({ added: fresh.length })
  } finally {
    lock.releaseLock()
  }
}

function json(value) {
  return ContentService.createTextOutput(JSON.stringify(value)).setMimeType(ContentService.MimeType.JSON)
}
