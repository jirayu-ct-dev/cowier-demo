import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createTestPrismaClient } from '../../../tests/integration/database'
import { hashPassword, verifyPassword } from '../../core/auth/password'
import {
  authenticate,
  changeAccountStatus,
  completeFirstLogin,
  findAuthUserById,
  resetUserPassword,
} from './service'

const database = createTestPrismaClient()
const password = 'Password123'
const temporaryPassword = 'Temporary456'
const ids = {
  staff: 'cp2-staff',
  active: 'cp2-active',
  firstLogin: 'cp2-first',
  suspended: 'cp2-suspended',
  terminated: 'cp2-terminated',
  locked: 'cp2-locked',
}

const createUser = async (
  id: string,
  username: string,
  role: 'STAFF' | 'LECTURER' | 'STUDENT',
  status: 'FIRST_LOGIN' | 'ACTIVE' | 'SUSPENDED' | 'TERMINATED',
) => database.user.create({
  data: {
    id,
    username,
    passwordHash: await hashPassword(password),
    role,
    status,
    recordStatus: status === 'TERMINATED' ? 'INACTIVE' : 'ACTIVE',
    namePrefix: role === 'STUDENT' ? 'นาย' : 'อาจารย์',
    firstName: 'ทดสอบ',
    lastName: username,
  },
})

describe('authentication service with MySQL', () => {
  beforeAll(async () => {
    await database.auditLog.deleteMany({ where: { entityId: { in: Object.values(ids) } } })
    await database.user.deleteMany({ where: { id: { in: Object.values(ids) } } })
    await createUser(ids.staff, 'cp2staff', 'STAFF', 'ACTIVE')
    await createUser(ids.active, 'cp2active', 'STUDENT', 'ACTIVE')
    await createUser(ids.firstLogin, 'cp2first', 'STUDENT', 'FIRST_LOGIN')
    await createUser(ids.suspended, 'cp2suspended', 'LECTURER', 'SUSPENDED')
    await createUser(ids.terminated, 'cp2terminated', 'LECTURER', 'TERMINATED')
    await createUser(ids.locked, 'cp2locked', 'STUDENT', 'ACTIVE')
  })

  afterAll(async () => {
    await database.auditLog.deleteMany({ where: { entityId: { in: [...Object.values(ids), 'missing-user'] } } })
    await database.user.deleteMany({ where: { id: { in: Object.values(ids) } } })
    await database.$disconnect()
  })

  it('returns a public user for valid credentials without exposing the hash', async () => {
    const result = await authenticate('cp2active', password, {}, database)

    expect(result.status).toBe('success')
    if (result.status === 'success') {
      expect(result.user).toMatchObject({ id: ids.active, role: 'student', status: 'active' })
      expect(result.user).not.toHaveProperty('passwordHash')
    }
  })

  it('does not distinguish an unknown username from a wrong password', async () => {
    await expect(authenticate('missing-user', 'Wrong1234', {}, database)).resolves.toEqual({ status: 'invalid' })
    await expect(authenticate('cp2active', 'Wrong1234', {}, database)).resolves.toEqual({ status: 'invalid' })
  })

  it('locks an account after three failed attempts and rejects login while locked', async () => {
    await expect(authenticate('cp2locked', 'Wrong1234', {}, database)).resolves.toEqual({ status: 'invalid' })
    await expect(authenticate('cp2locked', 'Wrong1234', {}, database)).resolves.toEqual({ status: 'invalid' })
    await expect(authenticate('cp2locked', 'Wrong1234', {}, database)).resolves.toEqual({ status: 'locked' })
    await expect(authenticate('cp2locked', password, {}, database)).resolves.toEqual({ status: 'locked' })
  })

  it('rejects suspended and terminated accounts', async () => {
    await expect(authenticate('cp2suspended', password, {}, database)).resolves.toEqual({ status: 'suspended' })
    await expect(authenticate('cp2terminated', password, {}, database)).resolves.toEqual({ status: 'terminated' })
  })

  it('activates a first-login account and increments its session version', async () => {
    const user = await findAuthUserById(ids.firstLogin, database)
    expect(user).not.toBeNull()
    const result = await completeFirstLogin(user!, temporaryPassword, {}, database)

    expect(result.user.status).toBe('active')
    expect(result.sessionVersion).toBe(user!.sessionVersion + 1)
    const updated = await findAuthUserById(ids.firstLogin, database)
    await expect(verifyPassword(temporaryPassword, updated!.passwordHash)).resolves.toBe(true)
  })

  it('revokes prior sessions after Staff resets a password or suspends an account', async () => {
    const actor = await findAuthUserById(ids.staff, database)
    const targetBeforeReset = await findAuthUserById(ids.active, database)
    expect(actor).not.toBeNull()
    expect(targetBeforeReset).not.toBeNull()

    await resetUserPassword(actor!, ids.active, temporaryPassword, {}, database)
    const afterReset = await findAuthUserById(ids.active, database)
    expect(afterReset!.status).toBe('FIRST_LOGIN')
    expect(afterReset!.sessionVersion).toBe(targetBeforeReset!.sessionVersion + 1)

    await changeAccountStatus(actor!, ids.active, 'SUSPENDED', 'ทดสอบระงับบัญชี', {}, database)
    const afterSuspend = await findAuthUserById(ids.active, database)
    expect(afterSuspend!.status).toBe('SUSPENDED')
    expect(afterSuspend!.sessionVersion).toBe(afterReset!.sessionVersion + 1)
  })
})

