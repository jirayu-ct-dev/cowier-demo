import { describe, expect, it, vi } from 'vitest'
import { recordAudit } from './audit'

describe('recordAudit', () => {
  it('maps the public actor field to the AuditLog relation key', async () => {
    const create = vi.fn().mockResolvedValue({ id: 1n, occurredAt: new Date() })

    await recordAudit({
      actorUserId: 'user-1',
      action: 'company.create',
      entityType: 'company',
      entityId: 'company-1',
      after: { legalName: 'บริษัท ทดสอบ จำกัด' },
    }, { auditLog: { create } } as never)

    expect(create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        actorAccountId: 'user-1',
        action: 'company.create',
      }),
      select: { id: true, occurredAt: true },
    }))
  })
})
