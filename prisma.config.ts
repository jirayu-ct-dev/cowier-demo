import { defineConfig } from 'prisma/config'

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasources: {
    db: {
      url: process.env.DATABASE_URL || 'mysql://cowier:cowier@localhost:3306/cowier_db'
    }
  }
})
