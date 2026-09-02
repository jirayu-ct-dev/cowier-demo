export interface ApiMeta {
  page?: number
  pageSize?: number
  total?: number
  [key: string]: unknown
}

export const apiResponse = <T>(data: T, meta?: ApiMeta) => ({
  data,
  ...(meta ? { meta } : {}),
})
