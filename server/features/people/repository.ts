import type { AccountStatus, Prisma, PrismaClient, RecordStatus, UserRole } from '@prisma/client'
import type { PeopleListQuery, PersonCreateInput, PersonUpdateInput } from './schema'

export const personSelect = {
  id: true,
  username: true,
  role: true,
  status: true,
  recordStatus: true,
  namePrefix: true,
  firstName: true,
  lastName: true,
  cohortYear: true,
  section: true,
  canReviewPlacements: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.UserSelect

export type PersonRecord = Prisma.UserGetPayload<{ select: typeof personSelect }>

const roleMap = { student: 'STUDENT', lecturer: 'LECTURER' } as const satisfies Record<string, UserRole>
const accountStatusMap = {
  'first-login': 'FIRST_LOGIN',
  active: 'ACTIVE',
  suspended: 'SUSPENDED',
  terminated: 'TERMINATED',
} as const satisfies Record<string, AccountStatus>
const recordStatusMap = { active: 'ACTIVE', inactive: 'INACTIVE' } as const satisfies Record<string, RecordStatus>
const toAuditJson = (value: unknown) => JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue

export class PrismaPeopleRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async list(query: PeopleListQuery) {
    const where: Prisma.UserWhereInput = {
      role: roleMap[query.role],
      recordStatus: query.recordStatus ? recordStatusMap[query.recordStatus] : undefined,
      status: query.accountStatus ? accountStatusMap[query.accountStatus] : undefined,
      cohortYear: query.role === 'student' ? query.cohortYear : undefined,
      section: query.role === 'student' ? query.section : undefined,
      OR: query.search
        ? [
            { username: { contains: query.search } },
            { firstName: { contains: query.search } },
            { lastName: { contains: query.search } },
          ]
        : undefined,
    }
    const direction = query.sort.endsWith('desc') ? 'desc' : 'asc'
    const orderBy: Prisma.UserOrderByWithRelationInput[] = query.sort.startsWith('username')
      ? [{ username: direction }]
      : [{ firstName: direction }, { lastName: direction }, { username: 'asc' }]
    const [items, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        select: personSelect,
        orderBy,
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.prisma.user.count({ where }),
    ])
    return { items, total }
  }

  findById(id: string) {
    return this.prisma.user.findFirst({
      where: { OR: [{ id }, { username: id }] },
      select: personSelect,
    })
  }

  findIdByUsername(username: string) {
    return this.prisma.user.findUnique({ where: { username }, select: { id: true } })
  }

  create(input: PersonCreateInput, passwordHash: string, actorUserId: string) {
    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          username: input.username,
          passwordHash,
          role: roleMap[input.role],
          status: 'FIRST_LOGIN',
          recordStatus: 'ACTIVE',
          namePrefix: input.namePrefix,
          firstName: input.firstName,
          lastName: input.lastName,
          cohortYear: input.role === 'student' ? input.cohortYear : null,
          section: input.role === 'student' ? input.section : null,
          canReviewPlacements: input.role === 'lecturer' ? input.canReviewPlacements : false,
          createdById: actorUserId,
        },
        select: personSelect,
      })
      await tx.auditLog.create({
        data: {
          actorAccountId: actorUserId,
          action: 'PEOPLE_CREATE',
          entityType: 'User',
          entityId: user.id,
          afterData: toAuditJson(user),
        },
        select: { id: true },
      })
      return user
    })
  }

  update(id: string, input: PersonUpdateInput, actorUserId: string, before: PersonRecord) {
    const data: Prisma.UserUpdateInput = {
      username: input.username,
      namePrefix: input.namePrefix,
      firstName: input.firstName,
      lastName: input.lastName,
      cohortYear: input.role === 'student' ? input.cohortYear : undefined,
      section: input.role === 'student' ? input.section : undefined,
      canReviewPlacements: input.role === 'lecturer' ? input.canReviewPlacements : undefined,
    }
    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.update({ where: { id }, data, select: personSelect })
      await tx.auditLog.create({
        data: {
          actorAccountId: actorUserId,
          action: 'PEOPLE_UPDATE',
          entityType: 'User',
          entityId: id,
          beforeData: toAuditJson(before),
          afterData: toAuditJson(user),
        },
        select: { id: true },
      })
      return user
    })
  }
}
