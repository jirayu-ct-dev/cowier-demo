import type {
  CompanyStatus,
  Prisma,
  PrismaClient,
  RecordStatus,
  RegionCode,
} from '@prisma/client'
import type {
  CompanyListQuery,
  CompanySiteCreateInput,
  CompanySiteUpdateInput,
  CompanyUpdateInput,
  CompanyWithSiteCreateInput,
  ProvinceListQuery,
} from './schema'

const companyDetailSelect = {
  id: true,
  code: true,
  legalName: true,
  taxId: true,
  status: true,
  deactivatedAt: true,
  createdAt: true,
  updatedAt: true,
  sites: {
    select: {
      id: true,
      branchName: true,
      address: true,
      provinceId: true,
      postalCode: true,
      contactName: true,
      contactRole: true,
      contactPhone: true,
      contactEmail: true,
      recordStatus: true,
      createdAt: true,
      updatedAt: true,
      province: {
        select: {
          code: true,
          nameTh: true,
          region: true,
        },
      },
    },
    orderBy: [
      { recordStatus: 'asc' as const },
      { branchName: 'asc' as const },
    ],
  },
} satisfies Prisma.CompanySelect

const companySiteDetailSelect = companyDetailSelect.sites.select

export type CompanyDetailRecord = Prisma.CompanyGetPayload<{
  select: typeof companyDetailSelect
}>

export type CompanySiteDetailRecord = Prisma.CompanySiteGetPayload<{
  select: typeof companySiteDetailSelect
}>

export interface CompanyReferenceCounts {
  trackedApplications: number
  placementRequests: number
  letterBatches: number
  supervisionGroups: number
}

const toCompanyStatus = (status: CompanyListQuery['status']): CompanyStatus | undefined => (
  status?.toUpperCase() as CompanyStatus | undefined
)

const toRegionCode = (region: CompanyListQuery['region']): RegionCode | undefined => (
  region?.toUpperCase() as RegionCode | undefined
)

const toRecordStatus = (status: 'active' | 'inactive'): RecordStatus => status.toUpperCase() as RecordStatus

export class PrismaCompanyRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async listProvinces(query: ProvinceListQuery) {
    return this.prisma.province.findMany({
      where: {
        region: toRegionCode(query.region),
        nameTh: query.search ? { contains: query.search } : undefined,
      },
      select: {
        id: true,
        code: true,
        nameTh: true,
        region: true,
      },
      orderBy: { nameTh: 'asc' },
      take: 100,
    })
  }

  async provinceExists(provinceId: number) {
    return (await this.prisma.province.count({ where: { id: provinceId } })) > 0
  }

  async listCompanies(query: CompanyListQuery) {
    const where: Prisma.CompanyWhereInput = {
      status: toCompanyStatus(query.status),
      sites: query.provinceId || query.region
        ? {
            some: {
              provinceId: query.provinceId,
              province: query.region ? { region: toRegionCode(query.region) } : undefined,
            },
          }
        : undefined,
      OR: query.search
        ? [
            { code: { contains: query.search } },
            { legalName: { contains: query.search } },
            { taxId: { contains: query.search } },
            { sites: { some: { branchName: { contains: query.search } } } },
            { sites: { some: { contactName: { contains: query.search } } } },
          ]
        : undefined,
    }
    const skip = (query.page - 1) * query.pageSize

    const [items, total] = await this.prisma.$transaction([
      this.prisma.company.findMany({
        where,
        select: companyDetailSelect,
        orderBy: [
          { status: 'asc' },
          { legalName: 'asc' },
        ],
        skip,
        take: query.pageSize,
      }),
      this.prisma.company.count({ where }),
    ])

    return { items, total }
  }

  getCompanyById(companyId: string) {
    return this.prisma.company.findUnique({
      where: { id: companyId },
      select: companyDetailSelect,
    })
  }

  getCompanySite(companyId: string, siteId: string) {
    return this.prisma.companySite.findFirst({
      where: { id: siteId, companyId },
      select: companySiteDetailSelect,
    })
  }

  createCompanyWithSite(input: CompanyWithSiteCreateInput, actorUserId: string, code: string) {
    return this.prisma.$transaction(async (tx) => {
      const company = await tx.company.create({
        data: {
          code,
          legalName: input.company.legalName,
          taxId: input.company.taxId,
          status: 'ACTIVE',
          createdById: actorUserId,
          sites: {
            create: {
              ...input.site,
              recordStatus: 'ACTIVE',
            },
          },
        },
        select: companyDetailSelect,
      })

      return company
    })
  }

  updateCompanyWithSite(
    companyId: string,
    siteId: string,
    companyInput?: CompanyUpdateInput,
    siteInput?: CompanySiteUpdateInput,
  ) {
    return this.prisma.$transaction(async (tx) => {
      if (companyInput) {
        await tx.company.update({
          where: { id: companyId },
          data: companyInput,
          select: { id: true },
        })
      }
      if (siteInput) {
        await tx.companySite.update({
          where: { id: siteId },
          data: siteInput,
          select: { id: true },
        })
      }

      return tx.company.findUnique({
        where: { id: companyId },
        select: companyDetailSelect,
      })
    })
  }

  createCompanySite(companyId: string, input: CompanySiteCreateInput) {
    return this.prisma.companySite.create({
      data: {
        ...input,
        companyId,
        recordStatus: 'ACTIVE',
      },
      select: companySiteDetailSelect,
    })
  }

  updateCompanySite(siteId: string, input: CompanySiteUpdateInput) {
    return this.prisma.companySite.update({
      where: { id: siteId },
      data: input,
      select: companySiteDetailSelect,
    })
  }

  setCompanyStatus(companyId: string, status: 'active' | 'inactive', changedAt: Date) {
    return this.prisma.company.update({
      where: { id: companyId },
      data: {
        status: toCompanyStatus(status),
        deactivatedAt: status === 'inactive' ? changedAt : null,
      },
      select: companyDetailSelect,
    })
  }

  setCompanySiteStatus(siteId: string, status: 'active' | 'inactive') {
    return this.prisma.companySite.update({
      where: { id: siteId },
      data: { recordStatus: toRecordStatus(status) },
      select: companySiteDetailSelect,
    })
  }

  deleteCompanyIfUnreferenced(companyId: string) {
    return this.prisma.$transaction(async (tx) => {
      const company = await tx.company.findUnique({
        where: { id: companyId },
        select: {
          id: true,
          sites: {
            select: {
              _count: {
                select: {
                  trackedApplications: true,
                  placementRequests: true,
                  letterBatches: true,
                  supervisionGroups: true,
                },
              },
            },
          },
        },
      })
      if (!company) {
        return { outcome: 'not-found' as const }
      }

      const references = company.sites.reduce<CompanyReferenceCounts>((total, site) => ({
        trackedApplications: total.trackedApplications + site._count.trackedApplications,
        placementRequests: total.placementRequests + site._count.placementRequests,
        letterBatches: total.letterBatches + site._count.letterBatches,
        supervisionGroups: total.supervisionGroups + site._count.supervisionGroups,
      }), {
        trackedApplications: 0,
        placementRequests: 0,
        letterBatches: 0,
        supervisionGroups: 0,
      })
      if (Object.values(references).some(count => count > 0)) {
        return { outcome: 'referenced' as const, references }
      }

      await tx.companySite.deleteMany({ where: { companyId } })
      const deleted = await tx.company.delete({
        where: { id: companyId },
        select: { id: true },
      })
      return { outcome: 'deleted' as const, deleted }
    })
  }

  deleteCompanySiteIfUnreferenced(companyId: string, siteId: string) {
    return this.prisma.$transaction(async (tx) => {
      const site = await tx.companySite.findFirst({
        where: { id: siteId, companyId },
        select: {
          id: true,
          _count: {
            select: {
              trackedApplications: true,
              placementRequests: true,
              letterBatches: true,
              supervisionGroups: true,
            },
          },
        },
      })
      if (!site) {
        return { outcome: 'not-found' as const }
      }
      if (Object.values(site._count).some(count => count > 0)) {
        return {
          outcome: 'referenced' as const,
          references: site._count,
        }
      }

      const deleted = await tx.companySite.delete({
        where: { id: siteId },
        select: { id: true },
      })
      return { outcome: 'deleted' as const, deleted }
    })
  }
}
