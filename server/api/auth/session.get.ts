import { defineApiHandler } from '../../core/api-handler'
import { apiResponse } from '../../core/api-response'
import { ApiError } from '../../core/api-error'
import { requireUser } from '../../core/auth/session'
import { toAuthenticatedUser } from '../../features/auth/types'

export default defineApiHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session.user?.id) return apiResponse({ user: null })

  try {
    const user = await requireUser(event, { allowFirstLogin: true })
    return apiResponse({ user: toAuthenticatedUser(user) })
  }
  catch (error) {
    if (error instanceof ApiError && error.statusCode === 401) return apiResponse({ user: null })
    throw error
  }
})
