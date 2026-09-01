import { afterAll, describe, expect, it } from 'vitest'
import { createTestPrismaClient } from '../../../tests/integration/database'

const prisma = createTestPrismaClient()

afterAll(async () => {
  await prisma.$disconnect()
})

describe('Prisma MySQL adapter', () => {
  it('connects to the migrated test database', async () => {
    await expect(prisma.$queryRaw`SELECT 1 AS connected`).resolves.toEqual([
      { connected: 1n },
    ])
  })
})
