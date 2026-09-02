import type { PrismaClient } from '@prisma/client'
import { createPrismaClient } from './client'

const globalPrisma = globalThis as typeof globalThis & {
  __ciwiePrisma?: PrismaClient
}

const databaseUrl = process.env.DATABASE_URL
  ?? (process.env.NODE_ENV === 'production'
    ? undefined
    : 'mysql://ciwie:ciwie@localhost:3306/ciwie_db')

if (!databaseUrl) throw new Error('DATABASE_URL is required in production')

export const prisma = globalPrisma.__ciwiePrisma ?? createPrismaClient(databaseUrl)

if (process.env.NODE_ENV !== 'production') {
  globalPrisma.__ciwiePrisma = prisma
}
