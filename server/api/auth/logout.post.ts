import { defineApiHandler } from '../../core/api-handler'
import { apiResponse } from '../../core/api-response'
import { requireUser } from '../../core/auth/session'

export default defineApiHandler(async (event) => {
  await requireUser(event, { allowFirstLogin: true })
  await clearUserSession(event)
  return apiResponse({ loggedOut: true })
})

