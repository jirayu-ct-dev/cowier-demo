import { prisma } from '../../core/database/prisma'
import { PrismaPeopleRepository } from './repository'
import { createPeopleService } from './service'

export const peopleService = createPeopleService(new PrismaPeopleRepository(prisma))
