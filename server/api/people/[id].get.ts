import { defineApiHandler } from '../../core/api-handler'
import { apiResponse } from '../../core/api-response'
import { requireRole } from '../../core/auth/session'
import { parseRequestParams } from '../../core/validation'
import { peopleIdParamsSchema } from '../../features/people/schema'
import { peopleService } from '../../features/people/runtime'

export default defineApiHandler(async (event) => {
  const actor = await requireRole(event, 'staff', 'lecturer')
  const { id } = parseRequestParams(event, peopleIdParamsSchema)
  return apiResponse({ person: await peopleService.get(actor, id) })
})
