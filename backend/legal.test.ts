import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'

test('noty zachowują pełne licencje React i Lucide, w tym Feather', () => {
  const notices = readFileSync('public/THIRD-PARTY-NOTICES.txt', 'utf8')
  for (const path of ['node_modules/react/LICENSE', 'node_modules/react-dom/LICENSE', 'node_modules/lucide-react/LICENSE', 'public/fonts/Hanken-Grotesk-OFL.txt', 'public/fonts/Caveat-OFL.txt']) {
    assert.ok(notices.includes(readFileSync(path, 'utf8').trim()), path)
  }
  assert.match(notices, /Cole Bemis/)
  execFileSync(process.execPath, ['scripts/generate-notices.mjs', '--check'])
})

test('fonty i strony informacyjne działają bez zewnętrznych fontów i konta', () => {
  const styles = readFileSync('src/styles.css', 'utf8') + readFileSync('public/fonts.css', 'utf8') + readFileSync('public/legal.css', 'utf8')
  assert.doesNotMatch(styles, /fonts\.googleapis|fonts\.gstatic/)
  for (const font of ['HankenGrotesk-Variable.ttf', 'Caveat-Variable.ttf']) assert.ok(readFileSync(`public/fonts/${font}`).length > 1000)
  for (const page of ['privacy.html', 'licenses.html']) {
    const html = readFileSync(`public/${page}`, 'utf8')
    assert.match(html, /lang="pl"/)
    assert.doesNotMatch(html, /<script|mailto:/)
    assert.ok(readFileSync('src/App.tsx', 'utf8').includes(`href="/${page}"`))
  }
  assert.match(readFileSync('public/privacy.html', 'utf8'), /Dane identyfikacyjne i kanał kontaktowy administratora nie zostały udostępnione/)
})
