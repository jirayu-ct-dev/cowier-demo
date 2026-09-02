import { readBody } from 'h3'
import { defineApiHandler } from '../../core/api-handler'
import { apiResponse } from '../../core/api-response'
import { requireRole } from '../../core/auth/session'
import { parseInput, parseRequestParams } from '../../core/validation'
import {
  lecturerStudentUpdateSchema,
  peopleIdParamsSchema,
  personUpdateSchema,
} from '../../features/people/schema'
import { peopleService } from '../../features/people/runtime'

export default defineApiHandler(async (event) => {
  const actor = await requireRole(event, 'staff', 'lecturer')
  const { id } = parseRequestParams(event, peopleIdParamsSchema)
  const body = await readBody(event)
  const input = parseInput(
    actor.role === 'LECTURER' ? lecturerStudentUpdateSchema : personUpdateSchema,
    body,
  )
  return apiResponse({ person: await peopleService.update(actor, id, input) })
})
