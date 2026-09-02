export type PeopleRole = 'student' | 'lecturer'
export type PeopleAccountStatus = 'first-login' | 'active' | 'suspended' | 'terminated'
export type PeopleRecordStatus = 'active' | 'inactive'
export type PeopleSort = 'name-asc' | 'name-desc' | 'username-asc' | 'username-desc'

export interface PeopleRecord {
  id: string
  username: string
  role: PeopleRole
  accountStatus: PeopleAccountStatus
  recordStatus: PeopleRecordStatus
  namePrefix: string
  firstName: string
  lastName: string
  cohortYear: number | null
  section: string | null
  canReviewPlacements: boolean
  createdAt: string
  updatedAt: string
}

export interface PeopleListQuery {
  role: PeopleRole
  search?: string
  recordStatus?: PeopleRecordStatus
  accountStatus?: PeopleAccountStatus
  cohortYear?: number
  section?: string
  sort?: PeopleSort
  page?: number
  pageSize?: number
}

export interface PeopleCreateInput {
  role: PeopleRole
  username: string
  temporaryPassword: string
  namePrefix: string
  firstName: string
  lastName: string
  cohortYear?: number
  section?: string
  canReviewPlacements?: boolean
}

export interface PeopleUpdateInput {
  role: PeopleRole
  username?: string
  namePrefix?: string
  firstName?: string
  lastName?: string
  cohortYear?: number
  section?: string
  canReviewPlacements?: boolean
}

interface ApiErrorPayload {
  error?: {
    code?: string
    message?: string
    details?: {
      field?: string
      issues?: Array<{ path?: string, message?: string }>
    }
  }
}

export class PeopleActionError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly fieldErrors: Record<string, string> = {},
  ) {
    super(message)
    this.name = 'PeopleActionError'
  }
}

const toPeopleActionError = (error: unknown) => {
  const payload = (error as { data?: ApiErrorPayload })?.data?.error
  const fieldErrors = Object.fromEntries(
    (payload?.details?.issues ?? [])
      .filter(issue => issue.path && issue.message)
      .map(issue => [issue.path as string, issue.message as string]),
  )
  if (payload?.details?.field && payload.message) {
    fieldErrors[payload.details.field] = payload.message
  }
  return new PeopleActionError(
    payload?.code ?? 'UNKNOWN_ERROR',
    payload?.message ?? 'ไม่สามารถดำเนินการได้',
    fieldErrors,
  )
}

export const usePeopleApi = () => {
  const list = (query: PeopleListQuery | Ref<PeopleListQuery>) => useFetch<{
    data: { items: PeopleRecord[] }
    meta: { page: number, pageSize: number, total: number }
  }>('/api/people', {
    query,
    watch: false,
  })

  const get = (id: string | Ref<string>) => useFetch<{ data: { person: PeopleRecord } }>(
    () => `/api/people/${encodeURIComponent(toValue(id))}`,
  )

  const create = async (input: PeopleCreateInput) => {
    try {
      return await $fetch<{ data: { person: PeopleRecord } }>('/api/people', {
        method: 'POST',
        body: input,
      })
    }
    catch (error) {
      throw toPeopleActionError(error)
    }
  }

  const update = async (id: string, input: PeopleUpdateInput | Pick<PeopleUpdateInput, 'firstName' | 'lastName'>) => {
    try {
      return await $fetch<{ data: { person: PeopleRecord } }>(`/api/people/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        body: input,
      })
    }
    catch (error) {
      throw toPeopleActionError(error)
    }
  }

  return { list, get, create, update }
}
