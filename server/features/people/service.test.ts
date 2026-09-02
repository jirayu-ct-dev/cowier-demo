import { describe, expect, it, vi } from 'vitest'
import { ApiError } from '../../core/api-error'
import { createPeopleService } from './service'

const student = {
  id: 'student-id',
  username: '66123456701',
  role: 'STUDENT',
  status: 'ACTIVE',
  recordStatus: 'ACTIVE',
  namePrefix: 'นาย',
  firstName: 'ทดสอบ',
  lastName: 'ระบบ',
  cohortYear: 2569,
  section: 'หมู่ 1',
  canReviewPlacements: false,
  createdAt: new Date('2026-09-02T00:00:00Z'),
  updatedAt: new Date('2026-09-02T00:00:00Z'),
} as const

const staff = { id: 'staff-id', role: 'STAFF' } as const
const lecturer = { id: 'lecturer-id', role: 'LECTURER' } as const

const createRepository = () => ({
  list: vi.fn(),
  findById: vi.fn(),
  findIdByUsername: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
})

describe('people service', () => {
  it('prevents lecturers from listing lecturer accounts', async () => {
    const repository = createRepository()
    const service = createPeopleService(repository as never)
    await expect(service.list(lecturer as never, {
      role: 'lecturer', page: 1, pageSize: 20, sort: 'name-asc',
    })).rejects.toMatchObject({ statusCode: 403 })
    expect(repository.list).not.toHaveBeenCalled()
  })

  it('allows lecturers to change only student names', async () => {
    const repository = createRepository()
    repository.findById.mockResolvedValue(student)
    repository.update.mockResolvedValue({ ...student, firstName: 'ชื่อใหม่' })
    const service = createPeopleService(repository as never)
    const result = await service.update(lecturer as never, 'student-id', { firstName: 'ชื่อใหม่' })
    expect(result.firstName).toBe('ชื่อใหม่')
    expect(repository.update).toHaveBeenCalledWith(
      'student-id',
      { role: 'student', firstName: 'ชื่อใหม่' },
      'lecturer-id',
      student,
    )
  })

  it('rejects duplicate usernames before hashing or creating', async () => {
    const repository = createRepository()
    repository.findIdByUsername.mockResolvedValue({ id: 'existing-id' })
    const hash = vi.fn()
    const service = createPeopleService(repository as never, { hash })
    const action = service.create(staff as never, {
      role: 'lecturer',
      username: 'L001',
      temporaryPassword: 'Temp1234',
      namePrefix: 'อาจารย์',
      firstName: 'ทดสอบ',
      lastName: 'ระบบ',
      canReviewPlacements: false,
    })
    await expect(action).rejects.toBeInstanceOf(ApiError)
    expect(hash).not.toHaveBeenCalled()
    expect(repository.create).not.toHaveBeenCalled()
  })

  it('hashes temporary passwords before persistence', async () => {
    const repository = createRepository()
    repository.findIdByUsername.mockResolvedValue(null)
    repository.create.mockResolvedValue({ ...student, status: 'FIRST_LOGIN' })
    const hash = vi.fn().mockResolvedValue('hashed-password')
    const service = createPeopleService(repository as never, { hash })
    await service.create(staff as never, {
      role: 'student',
      username: student.username,
      temporaryPassword: 'Temp1234',
      namePrefix: student.namePrefix,
      firstName: student.firstName,
      lastName: student.lastName,
      cohortYear: student.cohortYear,
      section: student.section,
    })
    expect(hash).toHaveBeenCalledWith('Temp1234')
    expect(repository.create).toHaveBeenCalledWith(expect.any(Object), 'hashed-password', 'staff-id')
  })
})
