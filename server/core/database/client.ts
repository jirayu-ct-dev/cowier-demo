import { PrismaMariaDb } from '@prisma/adapter-mariadb'
import { PrismaClient } from '@prisma/client'

export const createPrismaClient = (databaseUrl: string) => {
  if (!databaseUrl.startsWith('mysql://')) {
    throw new Error('DATABASE_URL must use the mysql:// protocol')
  }

  const adapter = new PrismaMariaDb(databaseUrl)
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  })
}
