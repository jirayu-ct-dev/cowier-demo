import 'dotenv/config'
import { createPrismaClient } from '../server/core/database/client'
import { hashPassword } from '../server/core/auth/password'
import { provinceSeeds } from './seed-data/provinces'

const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  throw new Error('DATABASE_URL is required to seed the database')
}

const prisma = createPrismaClient(databaseUrl)

const date = (value: string) => new Date(`${value}T00:00:00.000Z`)

const cycleSeeds = [
  {
    code: 'CYCLE-2569-2',
    label: 'ภาคเรียนที่ 2/2569',
    academicYear: 2569,
    term: 'SECOND' as const,
    termLabel: 'ภาคเรียนที่ 2',
    targetCohortYear: 2566,
    requestStartDate: date('2026-08-01'),
    requestEndDate: date('2026-09-30'),
    trainingStartDate: date('2026-11-02'),
    trainingEndDate: date('2027-03-05'),
    status: 'OPEN_FOR_REQUESTS' as const,
  },
  {
    code: 'CYCLE-2569-SUMMER',
    label: 'ภาคฤดูร้อน/2569',
    academicYear: 2569,
    term: 'SUMMER' as const,
    termLabel: 'ภาคฤดูร้อน',
    targetCohortYear: 2566,
    requestStartDate: date('2027-01-04'),
    requestEndDate: date('2027-02-12'),
    trainingStartDate: date('2027-03-22'),
    trainingEndDate: date('2027-05-28'),
    status: 'DRAFT' as const,
  },
  {
    code: 'CYCLE-2570-1',
    label: 'ภาคเรียนที่ 1/2570',
    academicYear: 2570,
    term: 'FIRST' as const,
    termLabel: 'ภาคเรียนที่ 1',
    targetCohortYear: 2566,
    requestStartDate: date('2027-04-01'),
    requestEndDate: date('2027-05-31'),
    trainingStartDate: date('2027-06-14'),
    trainingEndDate: date('2027-10-15'),
    status: 'DRAFT' as const,
  },
]

const seedProvinces = async () => {
  for (const province of provinceSeeds) {
    await prisma.province.upsert({
      where: { code: province.code },
      create: province,
      update: {
        nameTh: province.nameTh,
        region: province.region,
      },
    })
  }
}

const seedCycles = async () => {
  for (const cycle of cycleSeeds) {
    const { status, ...definition } = cycle
    await prisma.coopCycle.upsert({
      where: { code: cycle.code },
      create: cycle,
      update: definition,
    })
  }
}

const seedInitialStaff = async () => {
  const username = process.env.SEED_STAFF_USERNAME?.trim()
  const password = process.env.SEED_STAFF_PASSWORD
  if (!username || !password) {
    console.info('Skipped initial Staff seed: set SEED_STAFF_USERNAME and SEED_STAFF_PASSWORD to create it')
    return
  }
  if (password.length < 12) {
    throw new Error('SEED_STAFF_PASSWORD must contain at least 12 characters')
  }

  const passwordHash = await hashPassword(password)
  await prisma.user.upsert({
    where: { username },
    create: {
      username,
      passwordHash,
      role: 'STAFF',
      status: 'FIRST_LOGIN',
      recordStatus: 'ACTIVE',
      namePrefix: process.env.SEED_STAFF_NAME_PREFIX?.trim() || 'เจ้าหน้าที่',
      firstName: process.env.SEED_STAFF_FIRST_NAME?.trim() || 'ระบบ',
      lastName: process.env.SEED_STAFF_LAST_NAME?.trim() || 'สหกิจศึกษา',
    },
    update: {
      namePrefix: process.env.SEED_STAFF_NAME_PREFIX?.trim() || 'เจ้าหน้าที่',
      firstName: process.env.SEED_STAFF_FIRST_NAME?.trim() || 'ระบบ',
      lastName: process.env.SEED_STAFF_LAST_NAME?.trim() || 'สหกิจศึกษา',
    },
  })
}

const main = async () => {
  await seedProvinces()
  await seedCycles()
  await seedInitialStaff()
  console.info(`Seeded ${provinceSeeds.length} provinces and ${cycleSeeds.length} co-op cycles`)
}

main()
  .finally(async () => {
    await prisma.$disconnect()
  })
