import { describe, expect, it } from 'vitest'
import {
  importPersonRowSchema,
  lecturerStudentUpdateSchema,
  peopleListQuerySchema,
  peopleImportSchema,
  personCreateSchema,
  personUpdateSchema,
} from './schema'

describe('people schemas', () => {
  it('coerces and bounds list pagination', () => {
    expect(peopleListQuerySchema.parse({ role: 'student', page: '2', pageSize: '50' })).toMatchObject({
      role: 'student',
      page: 2,
      pageSize: 50,
      sort: 'name-asc',
    })
    expect(peopleListQuerySchema.safeParse({ role: 'student', pageSize: '101' }).success).toBe(false)
  })

  it('requires student cohort and section on create', () => {
    const result = personCreateSchema.safeParse({
      role: 'student',
      username: '66123456701',
      temporaryPassword: 'Temp1234',
      namePrefix: 'นาย',
      firstName: 'ทดสอบ',
      lastName: 'ระบบ',
    })
    expect(result.success).toBe(false)
  })

  it('rejects a temporary password equal to the username', () => {
    const result = personCreateSchema.safeParse({
      role: 'lecturer',
      username: 'Lecturer123',
      temporaryPassword: 'Lecturer123',
      namePrefix: 'อาจารย์',
      firstName: 'ทดสอบ',
      lastName: 'ระบบ',
    })
    expect(result.success).toBe(false)
  })

  it('does not allow role-specific fields to cross person types', () => {
    expect(personCreateSchema.safeParse({
      role: 'lecturer',
      username: 'L001',
      temporaryPassword: 'Temp1234',
      namePrefix: 'อาจารย์',
      firstName: 'ทดสอบ',
      lastName: 'ระบบ',
      cohortYear: 2569,
    }).success).toBe(false)

    expect(personUpdateSchema.safeParse({ role: 'student', canReviewPlacements: true }).success).toBe(false)
  })

  it('limits lecturer edits of students to first and last name', () => {
    expect(lecturerStudentUpdateSchema.safeParse({ firstName: 'ชื่อใหม่' }).success).toBe(true)
    expect(lecturerStudentUpdateSchema.safeParse({ section: 'หมู่ 2' }).success).toBe(false)
  })

  it('validates import rows without accepting account secrets', () => {
    expect(importPersonRowSchema.safeParse({
      rowNumber: 2,
      username: '66123456701',
      namePrefix: 'นาย',
      firstName: 'ทดสอบ',
      lastName: 'ระบบ',
    }).success).toBe(true)
    expect(importPersonRowSchema.safeParse({
      rowNumber: 2,
      username: '66123456701',
      namePrefix: 'นาย',
      firstName: 'ทดสอบ',
      lastName: 'ระบบ',
      temporaryPassword: 'must-not-be-imported',
    }).success).toBe(false)
  })

  it('rejects duplicate usernames within one import request', () => {
    expect(peopleImportSchema.safeParse({
      role: 'student',
      rows: [
        { rowNumber: 2, username: 'S001', namePrefix: 'นาย', firstName: 'หนึ่ง', lastName: 'ทดสอบ' },
        { rowNumber: 3, username: 'S001', namePrefix: 'นาย', firstName: 'สอง', lastName: 'ทดสอบ' },
      ],
    }).success).toBe(false)
  })
})
