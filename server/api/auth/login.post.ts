import { defineApiHandler } from '../../core/api-handler'
import { apiResponse } from '../../core/api-response'
import { getAuditRequestContext } from '../../core/audit'
import { replaceAuthSession } from '../../core/auth/session'
import { parseRequestBody } from '../../core/validation'
import { authenticate, authResultError } from '../../features/auth/service'
import { loginSchema } from '../../features/auth/schema'

export default defineApiHandler(async (event) => {
  const input = await parseRequestBody(event, loginSchema)
  const result = await authenticate(input.username, input.password, getAuditRequestContext(event))
  if (result.status !== 'success') throw authResultError(result.status)

  await replaceAuthSession(event, result.user, result.sessionVersion)
  return apiResponse({
    user: result.user,
    requiresPasswordChange: result.user.status === 'first-login',
  })
})

