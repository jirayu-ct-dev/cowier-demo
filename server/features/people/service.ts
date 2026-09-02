import { apiErrors } from '../../core/api-error'
import { hashPassword } from '../../core/auth/password'
import type { AuthUserRecord } from '../auth/types'
import type { PrismaPeopleRepository, PersonRecord } from './repository'
import type {
  LecturerStudentUpdateInput,
  PeopleListQuery,
  PersonCreateInput,
  PersonUpdateInput,
} from './schema'

type PeopleRepository = Pick<PrismaPeopleRepository,
  'list' | 'findById' | 'findIdByUsername' | 'create' | 'update'
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
  dependencies: { hash?: (password: string) => Promise<string> } = {},
) => {
  const hash = dependencies.hash ?? hashPassword

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
  }
}
