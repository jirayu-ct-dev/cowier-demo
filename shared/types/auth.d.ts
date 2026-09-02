declare module '#auth-utils' {
  interface User {
    id: string
    username: string
    role: 'staff' | 'lecturer' | 'student'
    status: 'first-login' | 'active' | 'suspended' | 'terminated'
    name: string
    canReviewPlacements: boolean
  }

  interface SecureSessionData {
    sessionVersion: number
  }

  interface UserSession {
    loggedInAt?: number
  }
}

export {}

