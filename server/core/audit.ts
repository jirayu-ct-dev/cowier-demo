import type { Prisma, PrismaClient } from '@prisma/client'
import type { H3Event } from 'h3'
import { getRequestHeader, getRequestIP } from 'h3'
import { prisma } from './database/prisma'

type AuditDatabase = PrismaClient | Prisma.TransactionClient

export interface RecordAuditInput {
  actorUserId?: string | null
  action: string
  entityType: string
  entityId: string
  reason?: string | null
  before?: Prisma.InputJsonValue
  after?: Prisma.InputJsonValue
  metadata?: Prisma.InputJsonValue
  correlationId?: string | null
  ipAddress?: string | null
  userAgent?: string | null
}

export const recordAudit = (input: RecordAuditInput, database: AuditDatabase = prisma) => (
  database.auditLog.create({
    data: {
      actorAccountId: input.actorUserId,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      reason: input.reason,
      beforeData: input.before,
      afterData: input.after,
      metadata: input.metadata,
      correlationId: input.correlationId,
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
    },
    select: {
      id: true,
      occurredAt: true,
    },
  })
)

export const getAuditRequestContext = (event: H3Event) => ({
  correlationId: typeof event.context.requestId === 'string' ? event.context.requestId : null,
  ipAddress: getRequestIP(event, { xForwardedFor: true })?.slice(0, 45) ?? null,
  userAgent: getRequestHeader(event, 'user-agent')?.slice(0, 2000) ?? null,
})
