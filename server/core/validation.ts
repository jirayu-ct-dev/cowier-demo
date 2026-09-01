import type { H3Event } from 'h3'
import { getValidatedQuery, readValidatedBody } from 'h3'
import type { z } from 'zod'
import { apiError } from './api-error'

const parseRequest = <T>(schema: z.ZodType<T>, value: unknown): T => {
  const result = schema.safeParse(value)
  if (!result.success) {
    throw apiError(422, 'VALIDATION_ERROR', 'ข้อมูลที่ส่งมาไม่ถูกต้อง', result.error.flatten())
  }
  return result.data
}

export const readBody = <T>(event: H3Event, schema: z.ZodType<T>) =>
  readValidatedBody(event, body => parseRequest(schema, body))

export const readQuery = <T>(event: H3Event, schema: z.ZodType<T>) =>
  getValidatedQuery(event, query => parseRequest(schema, query))
