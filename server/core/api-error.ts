export type ApiErrorDetails = Record<string, unknown> | unknown[]

export class ApiError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string,
    public readonly details?: ApiErrorDetails,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export const apiErrors = {
  badRequest: (message = 'ข้อมูลคำขอไม่ถูกต้อง', details?: ApiErrorDetails) => (
    new ApiError(400, 'BAD_REQUEST', message, details)
  ),
  unauthorized: (message = 'กรุณาเข้าสู่ระบบ') => (
    new ApiError(401, 'UNAUTHORIZED', message)
  ),
  forbidden: (message = 'คุณไม่มีสิทธิ์ดำเนินการนี้') => (
    new ApiError(403, 'FORBIDDEN', message)
  ),
  notFound: (message = 'ไม่พบข้อมูลที่ต้องการ') => (
    new ApiError(404, 'NOT_FOUND', message)
  ),
  conflict: (message: string, details?: ApiErrorDetails) => (
    new ApiError(409, 'CONFLICT', message, details)
  ),
  validation: (details: ApiErrorDetails) => (
    new ApiError(422, 'VALIDATION_ERROR', 'ข้อมูลไม่ผ่านการตรวจสอบ', details)
  ),
  serviceUnavailable: (message = 'ระบบยังไม่พร้อมให้บริการ') => (
    new ApiError(503, 'SERVICE_UNAVAILABLE', message)
  ),
}

export interface ApiErrorResponse {
  error: {
    code: string
    message: string
    details?: ApiErrorDetails
    requestId?: string
  }
}

export const toApiErrorResponse = (error: unknown, requestId?: string): {
  statusCode: number
  body: ApiErrorResponse
} => {
  if (error instanceof ApiError) {
    return {
      statusCode: error.statusCode,
      body: {
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
          requestId,
        },
      },
    }
  }

  return {
    statusCode: 500,
    body: {
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'เกิดข้อผิดพลาดภายในระบบ',
        requestId,
      },
    },
  }
}
