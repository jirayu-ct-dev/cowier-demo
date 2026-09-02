import { z } from 'zod'

export const academicTermValues = ['first', 'second', 'summer', 'other'] as const
export const coopCycleStatusValues = ['draft', 'open', 'closed_to_requests', 'training', 'closed'] as const
export const enrollmentStatusValues = ['active', 'transferred_out', 'completed', 'terminated'] as const
export const studentWorkStatusValues = ['not_started', 'training', 'completed', 'terminated'] as const

export const academicTermSchema = z.enum(academicTermValues)
export const coopCycleStatusSchema = z.enum(coopCycleStatusValues)
export const enrollmentStatusSchema = z.enum(enrollmentStatusValues)
export const studentWorkStatusSchema = z.enum(studentWorkStatusValues)

export const isoDateSchema = z.string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'วันที่ต้องอยู่ในรูปแบบ YYYY-MM-DD')
  .refine(value => !Number.isNaN(Date.parse(`${value}T00:00:00Z`)), 'วันที่ไม่ถูกต้อง')

export const coopCycleDefinitionSchema = z.object({
  code: z.string().trim().min(1).max(50),
  label: z.string().trim().min(1).max(150),
  academicYear: z.number().int().min(1).max(9_999),
  term: academicTermSchema,
  termLabel: z.string().trim().min(1).max(100),
  targetCohortYear: z.number().int().min(1).max(9_999),
  requestStartDate: isoDateSchema,
  requestEndDate: isoDateSchema,
  trainingStartDate: isoDateSchema,
  trainingEndDate: isoDateSchema,
}).superRefine((input, context) => {
  if (input.requestStartDate > input.requestEndDate) {
    context.addIssue({
      code: 'custom',
      path: ['requestEndDate'],
      message: 'วันสิ้นสุดรับคำร้องต้องไม่อยู่ก่อนวันเริ่มรับคำร้อง',
    })
  }
  if (input.trainingStartDate > input.trainingEndDate) {
    context.addIssue({
      code: 'custom',
      path: ['trainingEndDate'],
      message: 'วันสิ้นสุดปฏิบัติงานต้องไม่อยู่ก่อนวันเริ่มปฏิบัติงาน',
    })
  }
})

export const cycleListQuerySchema = z.object({
  status: coopCycleStatusSchema.optional(),
  academicYear: z.coerce.number().int().min(1).max(9_999).optional(),
  term: academicTermSchema.optional(),
})

export const cycleEnrollmentUpdateSchema = z.object({
  enrollmentStatus: enrollmentStatusSchema.optional(),
  workStatus: studentWorkStatusSchema.optional(),
  exitReason: z.string().trim().min(1).max(5_000).nullable().optional(),
}).refine(
  input => Object.keys(input).length > 0,
  { message: 'ต้องระบุสถานะหรือข้อมูลที่ต้องการแก้ไขอย่างน้อยหนึ่งรายการ' },
)

export const cycleEnrollmentReassignSchema = z.object({
  targetCycleId: z.string().trim().min(1).max(30),
  reason: z.string().trim().min(1).max(5_000),
})

export type CoopCycleDefinitionInput = z.infer<typeof coopCycleDefinitionSchema>
export type CycleListQuery = z.infer<typeof cycleListQuerySchema>
export type CycleEnrollmentUpdateInput = z.infer<typeof cycleEnrollmentUpdateSchema>
export type CycleEnrollmentReassignInput = z.infer<typeof cycleEnrollmentReassignSchema>
