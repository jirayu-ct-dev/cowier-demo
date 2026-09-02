import { describe, expect, it } from 'vitest'
import { accountStatusSchema, changePasswordSchema, firstLoginPasswordSchema } from './schema'

describe('authentication schemas', () => {
  it('requires a password with at least eight characters, a letter, and a number', () => {
    expect(firstLoginPasswordSchema.safeParse({ newPassword: 'abcdefgh', confirmPassword: 'abcdefgh' }).success).toBe(false)
    expect(firstLoginPasswordSchema.safeParse({ newPassword: '12345678', confirmPassword: '12345678' }).success).toBe(false)
    expect(firstLoginPasswordSchema.safeParse({ newPassword: 'Password8', confirmPassword: 'Password8' }).success).toBe(true)
  })

  it('rejects mismatched and unchanged password input', () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: 'Password8',
      newPassword: 'Password8',
      confirmPassword: 'Password9',
    })

    expect(result.success).toBe(false)
  })

  it('requires a reason when suspending or terminating an account', () => {
    expect(accountStatusSchema.safeParse({ status: 'ACTIVE' }).success).toBe(true)
    expect(accountStatusSchema.safeParse({ status: 'SUSPENDED' }).success).toBe(false)
    expect(accountStatusSchema.safeParse({ status: 'TERMINATED', reason: 'พ้นสภาพ' }).success).toBe(true)
  })
})

