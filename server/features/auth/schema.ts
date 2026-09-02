import { z } from 'zod'

export const passwordSchema = z.string()
  .min(8, 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร')
  .max(128, 'รหัสผ่านต้องยาวไม่เกิน 128 ตัวอักษร')
  .regex(/[A-Za-zก-๙]/u, 'รหัสผ่านต้องมีตัวอักษรอย่างน้อย 1 ตัว')
  .regex(/\d/u, 'รหัสผ่านต้องมีตัวเลขอย่างน้อย 1 ตัว')

export const loginSchema = z.object({
  username: z.string().trim().min(1, 'กรุณากรอกชื่อผู้ใช้').max(100),
  password: z.string().min(1, 'กรุณากรอกรหัสผ่าน').max(256),
})

const newPasswordFields = z.object({
  newPassword: passwordSchema,
  confirmPassword: z.string().min(1, 'กรุณายืนยันรหัสผ่านใหม่').max(128),
}).refine(input => input.newPassword === input.confirmPassword, {
  path: ['confirmPassword'],
  message: 'รหัสผ่านทั้งสองช่องไม่ตรงกัน',
})

export const firstLoginPasswordSchema = newPasswordFields

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'กรุณากรอกรหัสผ่านปัจจุบัน').max(256),
  newPassword: passwordSchema,
  confirmPassword: z.string().min(1, 'กรุณายืนยันรหัสผ่านใหม่').max(128),
}).superRefine((input, context) => {
  if (input.newPassword !== input.confirmPassword) {
    context.addIssue({ code: 'custom', path: ['confirmPassword'], message: 'รหัสผ่านทั้งสองช่องไม่ตรงกัน' })
  }
  if (input.currentPassword === input.newPassword) {
    context.addIssue({ code: 'custom', path: ['newPassword'], message: 'รหัสผ่านใหม่ต้องไม่ซ้ำกับรหัสผ่านปัจจุบัน' })
  }
})

export const resetPasswordSchema = newPasswordFields

export const accountStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'SUSPENDED', 'TERMINATED']),
  reason: z.string().trim().max(1000).optional(),
}).superRefine((input, context) => {
  if (input.status !== 'ACTIVE' && !input.reason) {
    context.addIssue({ code: 'custom', path: ['reason'], message: 'กรุณาระบุเหตุผล' })
  }
})

export const userIdParamsSchema = z.object({
  id: z.string().trim().min(1).max(30),
})

