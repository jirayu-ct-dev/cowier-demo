import { z } from 'zod'

export const notificationEventTypeValues = [
  'PLACEMENT_SUBMITTED',
  'PLACEMENT_RETURNED',
  'PLACEMENT_CONFIRMED',
  'LETTER_PUBLISHED',
  'SUPERVISION_APPOINTMENT_PUBLISHED',
  'SUPERVISION_APPOINTMENT_UPDATED',
  'SUPERVISION_APPOINTMENT_COMPLETED',
  'EVALUATION_PENDING',
] as const

export const notificationSeverityValues = ['info', 'warning', 'success', 'error'] as const

export const notificationEventTypeSchema = z.enum(notificationEventTypeValues)
export const notificationSeveritySchema = z.enum(notificationSeverityValues)

const identifierSchema = z.string().trim().min(1).max(30)

export const createNotificationSchema = z.object({
  type: notificationEventTypeSchema,
  severity: notificationSeveritySchema.default('info'),
  title: z.string().trim().min(1).max(255),
  body: z.string().trim().min(1).max(5_000),
  deepLink: z.string().trim().startsWith('/').max(500).refine(value => !value.startsWith('//'), 'ลิงก์ต้องเป็น path ภายในระบบ').optional(),
  recipientUserIds: z.array(identifierSchema).min(1).transform(values => [...new Set(values)]),
  placementRequestId: identifierSchema.optional(),
  letterBatchId: identifierSchema.optional(),
  appointmentId: identifierSchema.optional(),
  createdById: identifierSchema.optional(),
})

export const notificationListQuerySchema = z.object({
  unreadOnly: z.enum(['true', 'false']).transform(value => value === 'true').optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
})

export const notificationIdParamsSchema = z.object({
  id: identifierSchema,
})

export type NotificationEventType = z.infer<typeof notificationEventTypeSchema>
export type CreateNotificationInput = z.infer<typeof createNotificationSchema>
export type NotificationListQuery = z.infer<typeof notificationListQuerySchema>
