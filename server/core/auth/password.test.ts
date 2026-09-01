import { describe, expect, it } from 'vitest'
import { hashPassword, verifyPassword } from './password'

describe('hashPassword', () => {
  it('stores a salted scrypt hash instead of the original password', async () => {
    const first = await hashPassword('TemporaryPass123!')
    const second = await hashPassword('TemporaryPass123!')

    expect(first).toMatch(/^scrypt\$16384\$8\$1\$/)
    expect(first).not.toContain('TemporaryPass123!')
    expect(first).not.toBe(second)
  })

  it('verifies the correct password and rejects invalid input', async () => {
    const hash = await hashPassword('TemporaryPass123!')

    await expect(verifyPassword('TemporaryPass123!', hash)).resolves.toBe(true)
    await expect(verifyPassword('wrong-password', hash)).resolves.toBe(false)
    await expect(verifyPassword('TemporaryPass123!', 'invalid-hash')).resolves.toBe(false)
  })
})
