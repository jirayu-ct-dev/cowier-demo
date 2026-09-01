import { createError, type H3Error } from 'h3'

export interface ApiErrorBody {
  code: string
  message: string
  details?: unknown
}

export const apiError = (
  statusCode: number,
  code: string,
  message: string,
  details?: unknown,
): H3Error<ApiErrorBody> => createError({
  statusCode,
  statusMessage: message,
  data: {
    code,
    message,
    ...(details === undefined ? {} : { details }),
  },
})
