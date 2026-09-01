import { defineApiHandler } from '../../../core/api-handler'
import { apiResponse } from '../../../core/api-response'
import { getAuditRequestContext } from '../../../core/audit'
import { replaceAuthSession, requireUser } from '../../../core/auth/session'
import { parseRequestBody } from '../../../core/validation'
import { firstLoginPasswordSchema } from '../../../features/auth/schema'
import { completeFirstLogin } from '../../../features/auth/service'

export default defineApiHandler(async (event) => {
  const user = await requireUser(event, { allowFirstLogin: true })
  const input = await parseRequestBody(event, firstLoginPasswordSchema)
  const result = await completeFirstLogin(user, input.newPassword, getAuditRequestContext(event))
  await replaceAuthSession(event, result.user, result.sessionVersion)
  return apiResponse({ user: result.user })
})

