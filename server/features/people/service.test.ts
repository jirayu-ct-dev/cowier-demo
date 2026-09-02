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
  findManyByUsernames: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  importPeople: vi.fn(),
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

  it('previews new, update, and cross-role conflict import rows', async () => {
    const repository = createRepository()
    repository.findManyByUsernames.mockResolvedValue([
      { id: 'student-id', username: 'S001', role: 'STUDENT' },
      { id: 'lecturer-id', username: 'L001', role: 'LECTURER' },
    ])
    const service = createPeopleService(repository as never)
    const rows = await service.previewImport(staff as never, {
      role: 'student',
      rows: [
        { rowNumber: 2, username: 'NEW', namePrefix: 'นาย', firstName: 'ใหม่', lastName: 'หนึ่ง' },
        { rowNumber: 3, username: 'S001', namePrefix: 'นาย', firstName: 'เดิม', lastName: 'สอง' },
        { rowNumber: 4, username: 'L001', namePrefix: 'นาย', firstName: 'ผิด', lastName: 'ประเภท' },
      ],
    })
    expect(rows.map(row => row.status)).toEqual(['new', 'update', 'invalid'])
  })

  it('hashes unique generated passwords only for new import accounts', async () => {
    const repository = createRepository()
    repository.findManyByUsernames.mockResolvedValue([{ id: 'student-id', username: 'S001', role: 'STUDENT' }])
    repository.importPeople.mockResolvedValue({ created: 1, updated: 1, createdUsernames: ['NEW'] })
    const hash = vi.fn().mockResolvedValue('hashed-password')
    const service = createPeopleService(repository as never, { hash, generateTemporaryPassword: () => 'RandomPass7' })
    const result = await service.commitImport(staff as never, {
      role: 'student',
      rows: [
        { rowNumber: 2, username: 'NEW', namePrefix: 'นาย', firstName: 'ใหม่', lastName: 'หนึ่ง' },
        { rowNumber: 3, username: 'S001', namePrefix: 'นาย', firstName: 'เดิม', lastName: 'สอง' },
      ],
    })
    expect(hash).toHaveBeenCalledOnce()
    expect(hash).toHaveBeenCalledWith('RandomPass7')
    expect(result.credentials).toEqual([{ username: 'NEW', temporaryPassword: 'RandomPass7' }])
    expect(repository.importPeople).toHaveBeenCalledWith('student', [
      expect.objectContaining({ username: 'NEW', passwordHash: 'hashed-password' }),
      expect.not.objectContaining({ passwordHash: expect.anything() }),
    ], 'staff-id')
  })
})
