import { describe, expect, it } from 'vitest'
import { apiErrors, toApiErrorResponse } from './api-error'

describe('toApiErrorResponse', () => {
  it('preserves safe domain error information', () => {
    expect(toApiErrorResponse(apiErrors.notFound('ไม่พบบริษัท'), 'request-1')).toEqual({
      statusCode: 404,
      body: {
        error: {
          code: 'NOT_FOUND',
          message: 'ไม่พบบริษัท',
          details: undefined,
          requestId: 'request-1',
        },
      },
    })
  })

  it('does not expose an unexpected error message or stack', () => {
    const result = toApiErrorResponse(new Error('database password leaked'))

    expect(result.statusCode).toBe(500)
    expect(JSON.stringify(result.body)).not.toContain('database password leaked')
    expect(result.body.error.message).toBe('เกิดข้อผิดพลาดภายในระบบ')
  })
})
