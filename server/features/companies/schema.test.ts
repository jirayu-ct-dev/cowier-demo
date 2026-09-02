import { describe, expect, it } from 'vitest'
import {
  companyListQuerySchema,
  companySiteCreateSchema,
  companyStatusUpdateSchema,
  companyUpdateSchema,
  companyWithSiteCreateSchema,
  companyWithSiteUpdateSchema,
} from './schema'

describe('company schemas', () => {
  it('validates the normalized company and site input used by the current form', () => {
    const result = companyWithSiteCreateSchema.parse({
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
    })

    expect(result.company.legalName).toBe('บริษัท ทดสอบ จำกัด')
    expect(result.site.branchName).toBe('สำนักงานใหญ่')
  })

  it('requires the contact fields defined by the requirement', () => {
    expect(companySiteCreateSchema.safeParse({
      address: '123 ตำบลในเมือง อำเภอเมืองบุรีรัมย์',
      provinceId: 1,
    }).success).toBe(false)
  })

  it('rejects an empty update', () => {
    expect(companyUpdateSchema.safeParse({}).success).toBe(false)
    expect(companyWithSiteUpdateSchema.safeParse({}).success).toBe(false)
  })

  it('does not allow pending to be selected by the staff status action', () => {
    expect(companyStatusUpdateSchema.safeParse({ status: 'pending' }).success).toBe(false)
  })

  it('normalizes pagination query values', () => {
    expect(companyListQuerySchema.parse({ page: '2', pageSize: '50' })).toMatchObject({
      page: 2,
      pageSize: 50,
    })
  })
})
