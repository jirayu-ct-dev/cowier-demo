import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { ApiError } from './api-error'
import { parseInput } from './validation'

describe('parseInput', () => {
  it('returns normalized Zod output', () => {
    expect(parseInput(z.object({ page: z.coerce.number().int() }), { page: '2' }))
      .toEqual({ page: 2 })
  })

  it('throws a safe validation error with field paths', () => {
    try {
      parseInput(z.object({ name: z.string().min(1) }), { name: '' })
      throw new Error('Expected parseInput to throw')
    }
    catch (error) {
      expect(error).toBeInstanceOf(ApiError)
      expect(error).toMatchObject({
        statusCode: 422,
        code: 'VALIDATION_ERROR',
        details: { issues: [{ path: 'name' }] },
      })
    }
  })
})
