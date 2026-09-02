import { describe, expect, it } from 'vitest'
import { createPrismaClient } from './client'

describe('createPrismaClient', () => {
  it('requires a MySQL connection URL', () => {
    expect(() => createPrismaClient('postgresql://localhost/ciwie'))
      .toThrow('DATABASE_URL must use the mysql:// protocol')
  })
})
