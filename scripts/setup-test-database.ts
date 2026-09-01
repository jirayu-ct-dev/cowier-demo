import { execFileSync } from 'node:child_process'

const databaseUrl = process.env.TEST_DATABASE_URL

if (!databaseUrl) {
  throw new Error('TEST_DATABASE_URL is required and must point to a disposable test database')
}

if (process.env.DATABASE_URL && databaseUrl === process.env.DATABASE_URL) {
  throw new Error('TEST_DATABASE_URL must not be the same as DATABASE_URL')
}

const pnpmExecutable = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm'

execFileSync(pnpmExecutable, ['exec', 'prisma', 'migrate', 'reset', '--force', '--skip-seed'], {
  env: { ...process.env, DATABASE_URL: databaseUrl },
  stdio: 'inherit',
})
