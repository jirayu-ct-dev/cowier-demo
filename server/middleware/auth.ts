import { getRequestURL } from 'h3'
import { defineApiHandler } from '../core/api-handler'
import { requireUser } from '../core/auth/session'

const publicApiPaths = new Set([
  '/api/health',
  '/api/auth/login',
  '/api/auth/logout',
  '/api/auth/session',
  '/api/_auth/session',
])

const firstLoginApiPaths = new Set([
  '/api/auth/password/first-login',
])

export default defineApiHandler(async (event) => {
  const pathname = getRequestURL(event).pathname
  if (!pathname.startsWith('/api/') || publicApiPaths.has(pathname)) return
  await requireUser(event, { allowFirstLogin: firstLoginApiPaths.has(pathname) })
})
