import { defineApiHandler } from '../../../core/api-handler'
import { apiResponse } from '../../../core/api-response'
import { getAuditRequestContext } from '../../../core/audit'
import { replaceAuthSession, requireUser } from '../../../core/auth/session'
import { parseRequestBody } from '../../../core/validation'
import { changePasswordSchema } from '../../../features/auth/schema'
import { changeOwnPassword } from '../../../features/auth/service'

export default defineApiHandler(async (event) => {
  const user = await requireUser(event)
  const input = await parseRequestBody(event, changePasswordSchema)
  const result = await changeOwnPassword(
    user,
    input.currentPassword,
    input.newPassword,
    getAuditRequestContext(event),
  )
  await replaceAuthSession(event, result.user, result.sessionVersion)
  return apiResponse({ user: result.user })
})

