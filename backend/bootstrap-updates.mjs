// One-off authenticated execution of the real hosted writer. The token stays in process memory.
import { randomBytes } from 'node:crypto'
import { spawn } from 'node:child_process'
const endpoint = process.argv[2]
if (!endpoint || !/^https:\/\/bookedin-updates\.[a-z0-9-]+\.workers\.dev$/.test(endpoint)) throw new Error('Pass the verified BookedIn Worker URL')
const allowedSources = ['empik', 'mokotow-library', 'big-book', 'czarne']
const sources = process.argv.length > 3 ? process.argv.slice(3) : allowedSources
if (sources.some(source => !allowedSources.includes(source))) throw new Error('Unsupported source')
const token = randomBytes(32).toString('hex')
await new Promise((resolve, reject) => {
  const child = spawn('pnpm', ['dlx', 'wrangler', 'secret', 'put', 'UPDATE_TOKEN', '--config', 'wrangler.updates.jsonc'], { stdio: ['pipe', 'pipe', 'pipe'] })
  let log = ''
  child.stdout.on('data', data => { log += data })
  child.stderr.on('data', data => { log += data })
  child.on('error', reject)
  child.on('exit', code => code === 0 ? resolve() : reject(new Error(log.replaceAll(token, '[redacted]'))))
  child.stdin.end(token)
})
for (const source of sources) {
  try {
    let response
    for (let attempt = 0; attempt < 5; attempt++) {
      response = await fetch(`${endpoint}/admin/refresh?source=${source}`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(240000) })
      if (response.status !== 401 || attempt === 4) break
      await response.body?.cancel()
      await new Promise(resolve => setTimeout(resolve, 3000 * (attempt + 1)))
    }
    console.log(source, response.status, (await response.text()).slice(0, 1000))
  } catch (error) { console.log(source, error.message) }
}
