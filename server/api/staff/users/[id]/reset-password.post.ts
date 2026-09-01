import { defineApiHandler } from '../../../../core/api-handler'
import { apiResponse } from '../../../../core/api-response'
import { getAuditRequestContext } from '../../../../core/audit'
import { requireRole } from '../../../../core/auth/session'
import { parseRequestBody, parseRequestParams } from '../../../../core/validation'
import { resetPasswordSchema, userIdParamsSchema } from '../../../../features/auth/schema'
import { resetUserPassword } from '../../../../features/auth/service'

export default defineApiHandler(async (event) => {
  const actor = await requireRole(event, 'staff')
  const { id } = parseRequestParams(event, userIdParamsSchema)
  const input = await parseRequestBody(event, resetPasswordSchema)
  const user = await resetUserPassword(actor, id, input.newPassword, getAuditRequestContext(event))
  return apiResponse({ user })
})
