export type AuthAccountStatus = 'first-login' | 'active' | 'suspended' | 'terminated'
export type AccountRole = 'staff' | 'lecturer' | 'student'

export interface AuthAccount {
  id: string
  username: string
  role: AccountRole
  status: AuthAccountStatus
  name: string
  canReviewPlacements: boolean
}

export type LoginResult =
  | { status: 'success', requiresPasswordChange: boolean }
  | { status: 'invalid' | 'locked' | 'suspended' | 'terminated' }

interface ApiErrorPayload {
  error?: {
    code?: string
    message?: string
    details?: {
      issues?: Array<{ path?: string, message?: string }>
    }
  }
}

export class AuthActionError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly fieldErrors: Record<string, string> = {},
  ) {
    super(message)
    this.name = 'AuthActionError'
  }
}

const toAuthActionError = (error: unknown) => {
  const payload = (error as { data?: ApiErrorPayload })?.data?.error
  const fieldErrors = Object.fromEntries(
    (payload?.details?.issues ?? [])
      .filter(issue => issue.path && issue.message)
      .map(issue => [issue.path as string, issue.message as string]),
  )
  return new AuthActionError(payload?.code ?? 'UNKNOWN_ERROR', payload?.message ?? 'ไม่สามารถดำเนินการได้', fieldErrors)
}

export const useAuth = () => {
  const userSession = useUserSession()
  const { scenario } = useScenario()
  const currentAccount = computed(() => userSession.user.value as AuthAccount | null)
  const authenticated = computed(() => userSession.loggedIn.value)

  const syncScenario = () => {
    const account = currentAccount.value
    if (!account) return
    scenario.value.role = account.role
    scenario.value.userName = account.name
  }

  watch(currentAccount, syncScenario, { immediate: true })

  const refresh = async () => {
    await userSession.fetch()
    syncScenario()
  }

  const login = async (username: string, password: string): Promise<LoginResult> => {
    try {
      const response = await $fetch<{ data: { user: AuthAccount, requiresPasswordChange: boolean } }>('/api/auth/login', {
        method: 'POST',
        body: { username, password },
      })
      await refresh()
      return { status: 'success', requiresPasswordChange: response.data.requiresPasswordChange }
    }
    catch (error) {
      const authError = toAuthActionError(error)
      const statusByCode = {
        AUTH_LOCKED: 'locked',
        ACCOUNT_SUSPENDED: 'suspended',
        ACCOUNT_TERMINATED: 'terminated',
      } as const
      return { status: statusByCode[authError.code as keyof typeof statusByCode] ?? 'invalid' }
    }
  }

  const completeFirstLogin = async (newPassword: string, confirmPassword: string) => {
    try {
      await $fetch('/api/auth/password/first-login', {
        method: 'POST',
        body: { newPassword, confirmPassword },
      })
      await refresh()
    }
    catch (error) {
      throw toAuthActionError(error)
    }
  }

  const changePassword = async (currentPassword: string, newPassword: string, confirmPassword: string) => {
    try {
      await $fetch('/api/auth/password/change', {
        method: 'POST',
        body: { currentPassword, newPassword, confirmPassword },
      })
      await refresh()
    }
    catch (error) {
      throw toAuthActionError(error)
    }
  }

  const logout = async () => {
    try {
      await $fetch('/api/auth/logout', { method: 'POST' })
    }
    finally {
      await refresh()
    }
  }

  return {
    ready: userSession.ready,
    authenticated,
    currentAccount,
    login,
    logout,
    refresh,
    changePassword,
    completeFirstLogin,
  }
}
