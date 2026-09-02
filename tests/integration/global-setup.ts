import { execFileSync } from 'node:child_process'
import { resolve } from 'node:path'
import { requireTestDatabaseUrl } from './database'

export default function setup() {
  const databaseUrl = requireTestDatabaseUrl()
  const prismaCli = resolve('node_modules/prisma/build/index.js')

  execFileSync(process.execPath, [prismaCli, 'migrate', 'deploy'], {
    env: {
      ...process.env,
      DATABASE_URL: databaseUrl,
    },
    stdio: 'inherit',
  })
}
