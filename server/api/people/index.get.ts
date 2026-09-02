import { defineApiHandler } from '../../core/api-handler'
import { apiResponse } from '../../core/api-response'
import { requireRole } from '../../core/auth/session'
import { parseRequestQuery } from '../../core/validation'
import { peopleListQuerySchema } from '../../features/people/schema'
import { peopleService } from '../../features/people/runtime'

export default defineApiHandler(async (event) => {
  const actor = await requireRole(event, 'staff', 'lecturer')
  const query = parseRequestQuery(event, peopleListQuerySchema)
  const result = await peopleService.list(actor, query)
  return apiResponse({ items: result.items }, {
    page: query.page,
    pageSize: query.pageSize,
    total: result.total,
  })
})
