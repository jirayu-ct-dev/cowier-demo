import { z } from 'zod'

export const companyStatusValues = ['pending', 'active', 'inactive'] as const
export const recordStatusValues = ['active', 'inactive'] as const
export const regionCodeValues = ['north', 'northeast', 'central', 'east', 'west', 'south'] as const

export const companyStatusSchema = z.enum(companyStatusValues)
export const recordStatusSchema = z.enum(recordStatusValues)
export const regionCodeSchema = z.enum(regionCodeValues)

const nullableText = (maxLength: number) => z.string().trim().min(1).max(maxLength).nullable().optional()

export const provinceListQuerySchema = z.object({
  search: z.string().trim().max(100).optional(),
  region: regionCodeSchema.optional(),
})

export const companyListQuerySchema = z.object({
  search: z.string().trim().max(100).optional(),
  status: companyStatusSchema.optional(),
  provinceId: z.coerce.number().int().positive().optional(),
  region: regionCodeSchema.optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
})

export const companyCreateSchema = z.object({
  legalName: z.string().trim().min(1).max(255),
  taxId: nullableText(20),
})

export const companyUpdateSchema = companyCreateSchema.partial().refine(
  input => Object.keys(input).length > 0,
  { message: 'ต้องระบุข้อมูลที่ต้องการแก้ไขอย่างน้อยหนึ่งรายการ' },
)

export const companySiteCreateSchema = z.object({
  branchName: z.string().trim().min(1).max(150).default('สำนักงานใหญ่'),
  address: z.string().trim().min(1).max(5_000),
  provinceId: z.number().int().positive(),
  postalCode: nullableText(10),
  contactName: z.string().trim().min(1).max(150),
  contactRole: nullableText(150),
  contactPhone: z.string().trim().min(1).max(50),
  contactEmail: z.string().trim().email().max(255).nullable().optional(),
})

export const companySiteUpdateSchema = companySiteCreateSchema.partial().refine(
  input => Object.keys(input).length > 0,
  { message: 'ต้องระบุข้อมูลที่ต้องการแก้ไขอย่างน้อยหนึ่งรายการ' },
)

export const companyWithSiteCreateSchema = z.object({
  company: companyCreateSchema,
  site: companySiteCreateSchema,
})

export const companyWithSiteUpdateSchema = z.object({
  company: companyUpdateSchema.optional(),
  site: companySiteUpdateSchema.optional(),
}).refine(
  input => input.company !== undefined || input.site !== undefined,
  { message: 'ต้องระบุข้อมูลบริษัทหรือสถานที่ปฏิบัติงานที่ต้องการแก้ไข' },
)

export const companyStatusUpdateSchema = z.object({
  status: z.enum(['active', 'inactive']),
})

export const companySiteStatusUpdateSchema = z.object({
  status: recordStatusSchema,
})

export type CompanyListQuery = z.infer<typeof companyListQuerySchema>
export type ProvinceListQuery = z.infer<typeof provinceListQuerySchema>
export type CompanyCreateInput = z.infer<typeof companyCreateSchema>
export type CompanyUpdateInput = z.infer<typeof companyUpdateSchema>
export type CompanySiteCreateInput = z.infer<typeof companySiteCreateSchema>
export type CompanySiteUpdateInput = z.infer<typeof companySiteUpdateSchema>
export type CompanyWithSiteCreateInput = z.infer<typeof companyWithSiteCreateSchema>
export type CompanyWithSiteUpdateInput = z.infer<typeof companyWithSiteUpdateSchema>
export type CompanyStatusUpdateInput = z.infer<typeof companyStatusUpdateSchema>
export type CompanySiteStatusUpdateInput = z.infer<typeof companySiteStatusUpdateSchema>
