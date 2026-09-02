import { createPrismaClient } from '../../server/core/database/client'

export const requireTestDatabaseUrl = () => {
  const databaseUrl = process.env.TEST_DATABASE_URL
  if (!databaseUrl) {
    throw new Error('TEST_DATABASE_URL is required for integration tests')
  }

  const databaseName = new URL(databaseUrl).pathname.replace(/^\//, '')
  if (!databaseName.toLowerCase().includes('test')) {
    throw new Error('TEST_DATABASE_URL must target a database whose name contains "test"')
  }

  return databaseUrl
}

export const createTestPrismaClient = () => createPrismaClient(requireTestDatabaseUrl())
