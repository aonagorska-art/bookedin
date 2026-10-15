import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../', import.meta.url))
const require = createRequire(import.meta.url)
const reactDomDir = dirname(require.resolve('react-dom/package.json'))
const components = ['react', 'react-dom', 'scheduler', 'lucide-react', 'vite'].map(name => {
  const manifest = require.resolve(`${name}/package.json`, { paths: [reactDomDir, root] })
  const pkg = JSON.parse(readFileSync(manifest, 'utf8'))
  const licenseFile = name === 'vite' ? 'LICENSE.md' : 'LICENSE'
  let text = readFileSync(join(dirname(manifest), licenseFile), 'utf8')
  if (name === 'vite') {
    if (!text.includes('# Licenses of bundled dependencies')) throw new Error('Review the updated Vite license layout')
    text = text.split('# Licenses of bundled dependencies')[0]
  }
  if (!/Copyright/i.test(text) || !/Permission/i.test(text)) throw new Error(`Incomplete license for ${name}`)
  return `${name} ${pkg.version}${name === 'vite' ? ' — browser modulepreload helper (core MIT notice)' : ''}\n${'='.repeat(72)}\n${text.trim()}`
})
const fonts = ['Hanken-Grotesk-OFL.txt', 'Caveat-OFL.txt'].map(file => `${file}\n${'='.repeat(72)}\n${readFileSync(join(root, 'public/fonts', file), 'utf8').trim()}`)
const notice = ['BOOKEDIN — THIRD-PARTY NOTICES',
  'These notices apply to the listed third-party components, not to the entire BookedIn project.\nGenerated from installed package license files and the official, unmodified font licenses.\nLucide includes both its ISC notice and the complete Feather-derived MIT notice.',
  ...components, ...fonts].join('\n\n') + '\n'
const destination = join(root, 'public/THIRD-PARTY-NOTICES.txt')
if (process.argv.includes('--check')) {
  if (readFileSync(destination, 'utf8') !== notice) throw new Error('Third-party notices are stale; run pnpm licenses')
  console.log('Third-party notices match installed dependencies and font licenses.')
} else {
  writeFileSync(destination, notice)
  console.log('Generated public/THIRD-PARTY-NOTICES.txt')
}
