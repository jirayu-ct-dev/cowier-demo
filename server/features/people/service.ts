import { randomBytes } from 'node:crypto'
import { apiErrors } from '../../core/api-error'
import { hashPassword } from '../../core/auth/password'
import type { AuthUserRecord } from '../auth/types'
import type { PreparedImportRow, PrismaPeopleRepository, PersonRecord } from './repository'
import type {
  LecturerStudentUpdateInput,
  PeopleImportInput,
  PeopleListQuery,
  PersonCreateInput,
  PersonUpdateInput,
} from './schema'

type PeopleRepository = Pick<PrismaPeopleRepository,
  'list' | 'findById' | 'findIdByUsername' | 'findManyByUsernames' | 'create' | 'update' | 'importPeople'
>

const roleMap = { STAFF: 'staff', LECTURER: 'lecturer', STUDENT: 'student' } as const
const statusMap = {
  FIRST_LOGIN: 'first-login', ACTIVE: 'active', SUSPENDED: 'suspended', TERMINATED: 'terminated',
} as const
const recordStatusMap = { ACTIVE: 'active', INACTIVE: 'inactive' } as const

export const toPublicPerson = (person: PersonRecord) => ({
  id: person.id,
  username: person.username,
  role: roleMap[person.role],
  accountStatus: statusMap[person.status],
  recordStatus: recordStatusMap[person.recordStatus],
  namePrefix: person.namePrefix,
  firstName: person.firstName,
  lastName: person.lastName,
  cohortYear: person.cohortYear,
  section: person.section,
  canReviewPlacements: person.role === 'LECTURER' && person.canReviewPlacements,
  createdAt: person.createdAt,
  updatedAt: person.updatedAt,
})

export const createPeopleService = (
  repository: PeopleRepository,
  dependencies: { hash?: (password: string) => Promise<string>, generateTemporaryPassword?: () => string } = {},
) => {
  const hash = dependencies.hash ?? hashPassword
  const generateTemporaryPassword = dependencies.generateTemporaryPassword
    ?? (() => `Cw${randomBytes(9).toString('base64url')}7`)

  const requirePerson = async (id: string) => {
    const person = await repository.findById(id)
    if (!person) throw apiErrors.notFound('ไม่พบข้อมูลบุคคล')
    return person
  }

  const ensureUsernameAvailable = async (username: string, currentId?: string) => {
    const existing = await repository.findIdByUsername(username)
    if (existing && existing.id !== currentId) {
      throw apiErrors.conflict('รหัสผู้ใช้นี้มีอยู่ในระบบแล้ว', { field: 'username' })
    }
  }

  const requireLecturerStudentAccess = (actor: AuthUserRecord, person: PersonRecord) => {
    if (actor.role === 'LECTURER' && person.role !== 'STUDENT') throw apiErrors.forbidden()
  }

  return {
    async list(actor: AuthUserRecord, query: PeopleListQuery) {
      if (actor.role === 'LECTURER' && query.role !== 'student') throw apiErrors.forbidden()
      const result = await repository.list(query)
      return { items: result.items.map(toPublicPerson), total: result.total }
    },

    async get(actor: AuthUserRecord, id: string) {
      const person = await requirePerson(id)
      requireLecturerStudentAccess(actor, person)
      return toPublicPerson(person)
    },

    async create(actor: AuthUserRecord, input: PersonCreateInput) {
      if (actor.role !== 'STAFF') throw apiErrors.forbidden()
      await ensureUsernameAvailable(input.username)
      const passwordHash = await hash(input.temporaryPassword)
      return toPublicPerson(await repository.create(input, passwordHash, actor.id))
    },

    async update(actor: AuthUserRecord, id: string, input: PersonUpdateInput | LecturerStudentUpdateInput) {
      const person = await requirePerson(id)
      requireLecturerStudentAccess(actor, person)
      if (actor.role === 'LECTURER') {
        const lecturerInput: PersonUpdateInput = { role: 'student', ...input }
        return toPublicPerson(await repository.update(person.id, lecturerInput, actor.id, person))
      }
      if (actor.role !== 'STAFF') throw apiErrors.forbidden()
      const staffInput = input as PersonUpdateInput
      if (roleMap[person.role] !== staffInput.role) {
        throw apiErrors.conflict('ประเภทบุคคลไม่ตรงกับข้อมูลเดิม')
      }
      if (staffInput.username) await ensureUsernameAvailable(staffInput.username, person.id)
      return toPublicPerson(await repository.update(person.id, staffInput, actor.id, person))
    },

    async previewImport(actor: AuthUserRecord, input: PeopleImportInput) {
      if (actor.role !== 'STAFF') throw apiErrors.forbidden()
      const existing = await repository.findManyByUsernames(input.rows.map(row => row.username))
      const existingByUsername = new Map(existing.map(person => [person.username, person]))
      return input.rows.map((row) => {
        const person = existingByUsername.get(row.username)
        if (!person) return { ...row, status: 'new' as const, reason: 'พร้อมสร้างข้อมูลและบัญชีใหม่' }
        if (roleMap[person.role] !== input.role) {
          return { ...row, status: 'invalid' as const, reason: 'รหัสนี้ถูกใช้กับบุคคลประเภทอื่นแล้ว' }
        }
        return { ...row, status: 'update' as const, reason: 'จะอัปเดตคำนำหน้าและชื่อ–นามสกุลโดยคงบัญชีเดิม' }
      })
    },

    async commitImport(actor: AuthUserRecord, input: PeopleImportInput) {
      if (actor.role !== 'STAFF') throw apiErrors.forbidden()
      const preview = await this.previewImport(actor, input)
      const invalid = preview.filter(row => row.status === 'invalid')
      if (invalid.length) throw apiErrors.conflict('ข้อมูลนำเข้าเปลี่ยนแปลง กรุณาตรวจสอบไฟล์อีกครั้ง', { rows: invalid.map(row => row.rowNumber) })

      const credentials: Array<{ username: string, temporaryPassword: string }> = []
      const preparedRows: PreparedImportRow[] = await Promise.all(preview.map(async (row) => {
        if (row.status === 'update') return row
        const temporaryPassword = generateTemporaryPassword()
        credentials.push({ username: row.username, temporaryPassword })
        return { ...row, passwordHash: await hash(temporaryPassword) }
      }))
      const result = await repository.importPeople(input.role, preparedRows, actor.id)
      const createdUsernames = new Set(result.createdUsernames)
      return {
        created: result.created,
        updated: result.updated,
        credentials: credentials.filter(credential => createdUsernames.has(credential.username)),
      }
    },
  }
}
