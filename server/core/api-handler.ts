import { randomUUID } from 'node:crypto'
import type { H3Event } from 'h3'
import { defineEventHandler, getRequestHeader, setResponseHeader, setResponseStatus } from 'h3'
import { toApiErrorResponse } from './api-error'

type ApiHandler<Output> = (event: H3Event) => Output | Promise<Output>

export const defineApiHandler = <Output>(handler: ApiHandler<Output>) => defineEventHandler(async (event) => {
  const requestId = typeof event.context.requestId === 'string'
    ? event.context.requestId
    : getRequestHeader(event, 'x-request-id')?.slice(0, 100) || randomUUID()
  event.context.requestId = requestId
  setResponseHeader(event, 'x-request-id', requestId)

  try {
    return await handler(event)
  }
  catch (error) {
    const response = toApiErrorResponse(error, requestId)
    setResponseStatus(event, response.statusCode)
    return response.body
  }
})
