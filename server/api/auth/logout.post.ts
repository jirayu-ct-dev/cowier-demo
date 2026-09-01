import { defineApiHandler } from '../../core/api-handler'
import { apiResponse } from '../../core/api-response'

export default defineApiHandler(async (event) => {
  await clearUserSession(event)
  return apiResponse({ loggedOut: true })
})
