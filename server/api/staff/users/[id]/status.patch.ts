import { defineApiHandler } from '../../../../core/api-handler'
import { apiResponse } from '../../../../core/api-response'
import { getAuditRequestContext } from '../../../../core/audit'
import { requireRole } from '../../../../core/auth/session'
import { parseRequestBody, parseRequestParams } from '../../../../core/validation'
import { accountStatusSchema, userIdParamsSchema } from '../../../../features/auth/schema'
import { changeAccountStatus } from '../../../../features/auth/service'

export default defineApiHandler(async (event) => {
  const actor = await requireRole(event, 'staff')
  const { id } = parseRequestParams(event, userIdParamsSchema)
  const input = await parseRequestBody(event, accountStatusSchema)
  const user = await changeAccountStatus(actor, id, input.status, input.reason, getAuditRequestContext(event))
  return apiResponse({ user })
})
