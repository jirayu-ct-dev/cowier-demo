import type { H3Event } from 'h3'
import { getQuery, getRouterParams, readBody } from 'h3'
import type { z } from 'zod'
import { apiErrors } from './api-error'

const validationDetails = (error: z.ZodError) => ({
  issues: error.issues.map(issue => ({
    path: issue.path.map(String).join('.'),
    code: issue.code,
    message: issue.message,
  })),
})

export const parseInput = <Output>(schema: z.ZodType<Output>, input: unknown): Output => {
  const result = schema.safeParse(input)
  if (!result.success) throw apiErrors.validation(validationDetails(result.error))
  return result.data
}

export const parseRequestBody = async <Output>(event: H3Event, schema: z.ZodType<Output>) => (
  parseInput(schema, await readBody(event))
)

export const parseRequestQuery = <Output>(event: H3Event, schema: z.ZodType<Output>) => (
  parseInput(schema, getQuery(event))
)

export const parseRequestParams = <Output>(event: H3Event, schema: z.ZodType<Output>) => (
  parseInput(schema, getRouterParams(event))
)
