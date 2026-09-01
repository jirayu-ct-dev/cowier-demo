import { apiErrors } from '../core/api-error'
import { defineApiHandler } from '../core/api-handler'
import { apiResponse } from '../core/api-response'
import { prisma } from '../core/database/prisma'

export default defineApiHandler(async () => {
  try {
    await prisma.$queryRaw`SELECT 1`
    return apiResponse({
      status: 'ok',
      database: 'up',
      checkedAt: new Date().toISOString(),
    })
  }
  catch {
    throw apiErrors.serviceUnavailable('Database is unavailable')
  }
})
