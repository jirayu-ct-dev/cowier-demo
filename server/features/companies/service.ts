import { randomUUID } from 'node:crypto'
import type { PrismaCompanyRepository } from './repository'
import type {
  CompanyListQuery,
  CompanySiteCreateInput,
  CompanySiteUpdateInput,
  CompanyWithSiteCreateInput,
  CompanyWithSiteUpdateInput,
  ProvinceListQuery,
} from './schema'

type CompanyRepository = Pick<PrismaCompanyRepository,
  | 'listProvinces'
  | 'provinceExists'
  | 'listCompanies'
  | 'getCompanyById'
  | 'getCompanySite'
  | 'createCompanyWithSite'
  | 'updateCompanyWithSite'
  | 'createCompanySite'
  | 'updateCompanySite'
  | 'setCompanyStatus'
  | 'setCompanySiteStatus'
  | 'deleteCompanyIfUnreferenced'
  | 'deleteCompanySiteIfUnreferenced'
>

export type CompanyResource = 'company' | 'company-site' | 'province'

export class CompanyResourceNotFoundError extends Error {
  constructor(public readonly resource: CompanyResource) {
    super(`ไม่พบข้อมูล ${resource}`)
    this.name = 'CompanyResourceNotFoundError'
  }
}

export class CompanyHasReferencesError extends Error {
  constructor(
    public readonly resource: Exclude<CompanyResource, 'province'>,
    public readonly references: {
      trackedApplications: number
      placementRequests: number
      letterBatches: number
      supervisionGroups: number
    },
  ) {
    super('ไม่สามารถลบข้อมูลที่มีประวัติอ้างอิงได้ กรุณาปิดใช้งานแทน')
    this.name = 'CompanyHasReferencesError'
  }
}

const createCompanyCode = () => `COMP-${randomUUID()}`

export const createCompanyService = (
  repository: CompanyRepository,
  dependencies: {
    now?: () => Date
    companyCode?: () => string
  } = {},
) => {
  const now = dependencies.now ?? (() => new Date())
  const companyCode = dependencies.companyCode ?? createCompanyCode

  const requireProvince = async (provinceId: number) => {
    if (!await repository.provinceExists(provinceId)) {
      throw new CompanyResourceNotFoundError('province')
    }
  }

  const requireCompany = async (companyId: string) => {
    const company = await repository.getCompanyById(companyId)
    if (!company) {
      throw new CompanyResourceNotFoundError('company')
    }
    return company
  }

  const requireSite = async (companyId: string, siteId: string) => {
    const site = await repository.getCompanySite(companyId, siteId)
    if (!site) {
      throw new CompanyResourceNotFoundError('company-site')
    }
    return site
  }

  return {
    listProvinces: (query: ProvinceListQuery) => repository.listProvinces(query),

    listCompanies: (query: CompanyListQuery) => repository.listCompanies(query),

    getCompany: requireCompany,

    async createCompany(input: CompanyWithSiteCreateInput, actorUserId: string) {
      await requireProvince(input.site.provinceId)
      return repository.createCompanyWithSite(input, actorUserId, companyCode())
    },

    async updateCompanyWithSite(
      companyId: string,
      siteId: string,
      input: CompanyWithSiteUpdateInput,
    ) {
      await requireCompany(companyId)
      await requireSite(companyId, siteId)
      if (input.site?.provinceId) {
        await requireProvince(input.site.provinceId)
      }
      const company = await repository.updateCompanyWithSite(
        companyId,
        siteId,
        input.company,
        input.site,
      )
      if (!company) {
        throw new CompanyResourceNotFoundError('company')
      }
      return company
    },

    async createCompanySite(companyId: string, input: CompanySiteCreateInput) {
      await requireCompany(companyId)
      await requireProvince(input.provinceId)
      return repository.createCompanySite(companyId, input)
    },

    async updateCompanySite(companyId: string, siteId: string, input: CompanySiteUpdateInput) {
      await requireSite(companyId, siteId)
      if (input.provinceId) {
        await requireProvince(input.provinceId)
      }
      return repository.updateCompanySite(siteId, input)
    },

    async setCompanyStatus(companyId: string, status: 'active' | 'inactive') {
      await requireCompany(companyId)
      return repository.setCompanyStatus(companyId, status, now())
    },

    async setCompanySiteStatus(companyId: string, siteId: string, status: 'active' | 'inactive') {
      await requireSite(companyId, siteId)
      return repository.setCompanySiteStatus(siteId, status)
    },

    async deleteCompany(companyId: string) {
      const result = await repository.deleteCompanyIfUnreferenced(companyId)
      if (result.outcome === 'not-found') {
        throw new CompanyResourceNotFoundError('company')
      }
      if (result.outcome === 'referenced') {
        throw new CompanyHasReferencesError('company', result.references)
      }
      return result.deleted
    },

    async deleteCompanySite(companyId: string, siteId: string) {
      const result = await repository.deleteCompanySiteIfUnreferenced(companyId, siteId)
      if (result.outcome === 'not-found') {
        throw new CompanyResourceNotFoundError('company-site')
      }
      if (result.outcome === 'referenced') {
        throw new CompanyHasReferencesError('company-site', result.references)
      }
      return result.deleted
    },
  }
}
