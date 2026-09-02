import { defineApiHandler } from '../../../core/api-handler'
import { apiResponse } from '../../../core/api-response'
import { requireRole } from '../../../core/auth/session'
import { parseRequestBody } from '../../../core/validation'
import { peopleService } from '../../../features/people/runtime'
import { peopleImportSchema } from '../../../features/people/schema'

export default defineApiHandler(async (event) => {
  const actor = await requireRole(event, 'staff')
  const input = await parseRequestBody(event, peopleImportSchema)
  return apiResponse(await peopleService.commitImport(actor, input))
})
