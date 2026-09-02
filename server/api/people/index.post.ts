import { defineApiHandler } from '../../core/api-handler'
import { apiResponse } from '../../core/api-response'
import { requireRole } from '../../core/auth/session'
import { parseRequestBody } from '../../core/validation'
import { personCreateSchema } from '../../features/people/schema'
import { peopleService } from '../../features/people/runtime'

export default defineApiHandler(async (event) => {
  const actor = await requireRole(event, 'staff')
  const input = await parseRequestBody(event, personCreateSchema)
  return apiResponse({ person: await peopleService.create(actor, input) })
})
