// Stop hook: run tests related to uncommitted changes in src/ before Claude finishes.
// Exit code 2 sends the failure back to Claude so it fixes the tests.
import { execSync } from 'node:child_process'

const input = JSON.parse(await new Promise((resolve) => {
  let data = ''
  process.stdin.on('data', (chunk) => (data += chunk))
  process.stdin.on('end', () => resolve(data || '{}'))
}))

// Already continuing because of this hook — don't loop forever.
if (input.stop_hook_active) process.exit(0)

const changed = execSync('git status --porcelain -- src', { encoding: 'utf8' }).trim()
if (!changed) process.exit(0)

try {
  execSync('npx vitest run --changed', { encoding: 'utf8', stdio: 'pipe' })
} catch (error) {
  const output = `${error.stdout ?? ''}${error.stderr ?? ''}`
  process.stderr.write(`Tests failed — fix them before finishing:\n${output.slice(-4000)}`)
  process.exit(2)
}
