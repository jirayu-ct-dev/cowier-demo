import { z } from 'zod'
import { passwordSchema } from '../auth/schema'

export const peopleRoles = ['student', 'lecturer'] as const
export const peopleRecordStatuses = ['active', 'inactive'] as const
export const peopleAccountStatuses = ['first-login', 'active', 'suspended', 'terminated'] as const

const usernameSchema = z.string()
  .trim()
  .min(1, 'กรุณากรอกรหัสผู้ใช้')
  .max(100, 'รหัสผู้ใช้ต้องยาวไม่เกิน 100 ตัวอักษร')

const nameSchema = z.string().trim().min(1, 'กรุณากรอกข้อมูล').max(100)
const sectionSchema = z.string().trim().min(1).max(50)

export const peopleListQuerySchema = z.object({
  role: z.enum(peopleRoles),
  search: z.string().trim().max(200).optional(),
  recordStatus: z.enum(peopleRecordStatuses).optional(),
  accountStatus: z.enum(peopleAccountStatuses).optional(),
  cohortYear: z.coerce.number().int().min(2500).max(3000).optional(),
  section: sectionSchema.optional(),
  sort: z.enum(['name-asc', 'name-desc', 'username-asc', 'username-desc']).default('name-asc'),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
})

const sharedPersonFields = {
  username: usernameSchema,
  namePrefix: z.string().trim().min(1).max(50),
  firstName: nameSchema,
  lastName: nameSchema,
}

const personCreateBaseSchema = z.object({
  ...sharedPersonFields,
  temporaryPassword: passwordSchema,
})

const studentFields = z.object({
  cohortYear: z.number().int().min(2500).max(3000),
  section: sectionSchema,
})

export const studentCreateSchema = personCreateBaseSchema.extend({
  role: z.literal('student'),
  ...studentFields.shape,
}).strict().superRefine((input, context) => {
  if (input.temporaryPassword === input.username) {
    context.addIssue({ code: 'custom', path: ['temporaryPassword'], message: 'รหัสผ่านชั่วคราวต้องไม่ซ้ำกับรหัสผู้ใช้' })
  }
})

export const lecturerCreateSchema = personCreateBaseSchema.extend({
  role: z.literal('lecturer'),
  canReviewPlacements: z.boolean().default(false),
}).strict().superRefine((input, context) => {
  if (input.temporaryPassword === input.username) {
    context.addIssue({ code: 'custom', path: ['temporaryPassword'], message: 'รหัสผ่านชั่วคราวต้องไม่ซ้ำกับรหัสผู้ใช้' })
  }
})

export const personCreateSchema = z.discriminatedUnion('role', [
  studentCreateSchema,
  lecturerCreateSchema,
])

const sharedUpdateFields = {
  username: usernameSchema.optional(),
  namePrefix: z.string().trim().min(1).max(50).optional(),
  firstName: nameSchema.optional(),
  lastName: nameSchema.optional(),
}

export const studentUpdateSchema = z.object({
  role: z.literal('student'),
  ...sharedUpdateFields,
  cohortYear: z.number().int().min(2500).max(3000).optional(),
  section: sectionSchema.optional(),
}).strict().refine(input => Object.keys(input).some(key => key !== 'role'), {
  message: 'กรุณาระบุข้อมูลที่ต้องการแก้ไข',
})

export const lecturerUpdateSchema = z.object({
  role: z.literal('lecturer'),
  ...sharedUpdateFields,
  canReviewPlacements: z.boolean().optional(),
}).strict().refine(input => Object.keys(input).some(key => key !== 'role'), {
  message: 'กรุณาระบุข้อมูลที่ต้องการแก้ไข',
})

export const personUpdateSchema = z.union([studentUpdateSchema, lecturerUpdateSchema])

export const lecturerStudentUpdateSchema = z.object({
  firstName: nameSchema.optional(),
  lastName: nameSchema.optional(),
}).strict().refine(input => input.firstName !== undefined || input.lastName !== undefined, {
  message: 'กรุณาระบุชื่อหรือนามสกุลที่ต้องการแก้ไข',
})

export const peopleIdParamsSchema = z.object({
  id: z.string().trim().min(1).max(30),
})

export const importPersonRowSchema = z.discriminatedUnion('role', [
  z.object({
    role: z.literal('student'),
    ...sharedPersonFields,
    ...studentFields.shape,
  }).strict(),
  z.object({
    role: z.literal('lecturer'),
    ...sharedPersonFields,
    canReviewPlacements: z.boolean().default(false),
  }).strict(),
])

export type PeopleListQuery = z.infer<typeof peopleListQuerySchema>
export type PersonCreateInput = z.infer<typeof personCreateSchema>
export type PersonUpdateInput = z.infer<typeof personUpdateSchema>
export type LecturerStudentUpdateInput = z.infer<typeof lecturerStudentUpdateSchema>
export type ImportPersonRow = z.infer<typeof importPersonRowSchema>
