import { describe, expect, it, vi } from 'vitest'
import {
  CompanyHasReferencesError,
  CompanyResourceNotFoundError,
  createCompanyService,
} from './service'

const companyInput = {
  company: {
    legalName: 'บริษัท ทดสอบ จำกัด',
    taxId: '0123456789012',
  },
  site: {
    branchName: 'สำนักงานใหญ่',
    address: '123 ตำบลในเมือง อำเภอเมืองบุรีรัมย์',
    provinceId: 1,
    contactName: 'คุณทดสอบ ระบบ',
    contactPhone: '044-000-000',
  },
}

const noReferences = {
  trackedApplications: 0,
  placementRequests: 0,
  letterBatches: 0,
  supervisionGroups: 0,
}

const createRepositoryMocks = () => ({
  listProvinces: vi.fn(),
  provinceExists: vi.fn().mockResolvedValue(true),
  listCompanies: vi.fn(),
  getCompanyById: vi.fn().mockResolvedValue({ id: 'company-1' }),
  getCompanySite: vi.fn().mockResolvedValue({ id: 'site-1' }),
  createCompanyWithSite: vi.fn().mockResolvedValue({ id: 'company-1' }),
  updateCompanyWithSite: vi.fn().mockResolvedValue({ id: 'company-1' }),
  createCompanySite: vi.fn().mockResolvedValue({ id: 'site-1' }),
  updateCompanySite: vi.fn().mockResolvedValue({ id: 'site-1' }),
  setCompanyStatus: vi.fn().mockResolvedValue({ id: 'company-1' }),
  setCompanySiteStatus: vi.fn().mockResolvedValue({ id: 'site-1' }),
  deleteCompanyIfUnreferenced: vi.fn().mockResolvedValue({
    outcome: 'deleted',
    deleted: { id: 'company-1' },
  }),
  deleteCompanySiteIfUnreferenced: vi.fn().mockResolvedValue({
    outcome: 'deleted',
    deleted: { id: 'site-1' },
  }),
})

type CompanyServiceRepository = Parameters<typeof createCompanyService>[0]

describe('company service', () => {
  it('creates an active company with its first site after checking the province', async () => {
    const repository = createRepositoryMocks()
    const service = createCompanyService(repository as unknown as CompanyServiceRepository, {
      companyCode: () => 'COMP-TEST',
    })

    await service.createCompany(companyInput, 'user-1')

    expect(repository.provinceExists).toHaveBeenCalledWith(1)
    expect(repository.createCompanyWithSite).toHaveBeenCalledWith(companyInput, 'user-1', 'COMP-TEST')
  })

  it('rejects a province that does not exist', async () => {
    const repository = createRepositoryMocks()
    repository.provinceExists.mockResolvedValue(false)
    const service = createCompanyService(repository as unknown as CompanyServiceRepository)

    await expect(service.createCompany(companyInput, 'user-1')).rejects.toMatchObject({
      name: 'CompanyResourceNotFoundError',
      resource: 'province',
    })
    expect(repository.createCompanyWithSite).not.toHaveBeenCalled()
  })

  it('does not update a site through a different company', async () => {
    const repository = createRepositoryMocks()
    repository.getCompanySite.mockResolvedValue(null)
    const service = createCompanyService(repository as unknown as CompanyServiceRepository)

    await expect(service.updateCompanySite('company-2', 'site-1', {
      contactPhone: '044-111-111',
    })).rejects.toBeInstanceOf(CompanyResourceNotFoundError)
    expect(repository.updateCompanySite).not.toHaveBeenCalled()
  })

  it('records the deactivation timestamp supplied by the service clock', async () => {
    const repository = createRepositoryMocks()
    const changedAt = new Date('2026-09-01T08:00:00.000Z')
    const service = createCompanyService(repository as unknown as CompanyServiceRepository, {
      now: () => changedAt,
    })

    await service.setCompanyStatus('company-1', 'inactive')

    expect(repository.setCompanyStatus).toHaveBeenCalledWith('company-1', 'inactive', changedAt)
  })

  it('blocks hard deletion when any site has a reference', async () => {
    const repository = createRepositoryMocks()
    repository.deleteCompanyIfUnreferenced.mockResolvedValue({
      outcome: 'referenced',
      references: { ...noReferences, placementRequests: 2 },
    })
    const service = createCompanyService(repository as unknown as CompanyServiceRepository)

    await expect(service.deleteCompany('company-1')).rejects.toMatchObject({
      name: 'CompanyHasReferencesError',
      resource: 'company',
      references: { placementRequests: 2 },
    })
  })

  it('deletes an unreferenced company and all of its sites through the repository transaction', async () => {
    const repository = createRepositoryMocks()
    const service = createCompanyService(repository as unknown as CompanyServiceRepository)

    await expect(service.deleteCompany('company-1')).resolves.toEqual({ id: 'company-1' })
    expect(repository.deleteCompanyIfUnreferenced).toHaveBeenCalledWith('company-1')
  })

  it('distinguishes a missing site from a referenced site during deletion', async () => {
    const repository = createRepositoryMocks()
    const service = createCompanyService(repository as unknown as CompanyServiceRepository)

    repository.deleteCompanySiteIfUnreferenced.mockResolvedValueOnce({ outcome: 'not-found' })
    await expect(service.deleteCompanySite('company-1', 'site-1'))
      .rejects.toBeInstanceOf(CompanyResourceNotFoundError)

    repository.deleteCompanySiteIfUnreferenced.mockResolvedValueOnce({
      outcome: 'referenced',
      references: { ...noReferences, supervisionGroups: 1 },
    })
    await expect(service.deleteCompanySite('company-1', 'site-1'))
      .rejects.toBeInstanceOf(CompanyHasReferencesError)
  })
})
