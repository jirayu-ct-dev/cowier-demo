import { defineApiHandler } from '../../core/api-handler'
import { apiResponse } from '../../core/api-response'
import { requireRole } from '../../core/auth/session'
import { parseRequestQuery } from '../../core/validation'
import { peopleService } from '../../features/people/runtime'
import { peopleExportQuerySchema } from '../../features/people/schema'

export default defineApiHandler(async (event) => {
  const actor = await requireRole(event, 'staff')
  const query = parseRequestQuery(event, peopleExportQuerySchema)
  return apiResponse({ people: await peopleService.export(actor, query) })
})
