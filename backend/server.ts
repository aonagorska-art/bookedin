import express from 'express'
import cors from 'cors'
import cron from 'node-cron'
import { db, listEvents, seedDatabase } from './db'
import { sources } from './sources'

const app = express()
const port = Number(process.env.PORT || 4174)
app.use(cors({ origin: [/^http:\/\/localhost:\d+$/, /^http:\/\/127\.0\.0\.1:\d+$/, /^http:\/\/192\.168\.\d+\.\d+:\d+$/] }))
app.use(express.json())
seedDatabase()

app.get('/api/health', (_req, res) => res.json({ ok: true, mode: 'local', scheduler: 'active' }))
app.get('/api/events', (_req, res) => res.json({ events: listEvents() }))
app.get('/api/sources', (_req, res) => res.json({ sources }))

app.post('/api/watch/simulate', (_req, res) => {
  const event = listEvents()[0]
  if (!event) return res.status(404).json({ error: 'Brak wydarzenia do podglądu powiadomienia.' })
  const notice = { id: `preview:${event.id}`, type: 'info', title: 'Przykładowe powiadomienie BookedIn', body: `Gdy zmieni się termin wydarzenia „${event.title}”, zobaczysz tutaj krótki alert.`, createdAt: new Date().toISOString(), eventId: event.id, read: false }
  res.json({ event, changes: [], notice })
})

cron.schedule('*/30 * * * *', () => {
  const checkedAt = new Date().toISOString()
  for (const source of sources) db.prepare('INSERT INTO source_checks (source_id, checked_at, succeeded, note) VALUES (?, ?, ?, ?)').run(source.id, checkedAt, 0, 'Tryb lokalny: automatyczny import sieciowy nie został uruchomiony.')
  console.log(`[BookedIn Watch] ${checkedAt}: zapisano lokalną kontrolę źródeł; import sieciowy pozostaje wyłączony.`)
})

app.listen(port, '0.0.0.0', () => console.log(`BookedIn API działa na http://localhost:${port}`))
