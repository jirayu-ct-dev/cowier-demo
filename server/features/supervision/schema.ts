import { z } from 'zod'
import { isoDateSchema } from '../cycles/schema'

export const supervisionRoundValues = [1, 2] as const
export const supervisionPeriodValues = ['morning', 'afternoon'] as const
export const supervisionAppointmentStatusValues = ['draft', 'published', 'postponed', 'completed', 'cancelled'] as const

export const supervisionRoundSchema = z.union([z.literal(1), z.literal(2)])
export const supervisionPeriodSchema = z.enum(supervisionPeriodValues)
export const supervisionAppointmentStatusSchema = z.enum(supervisionAppointmentStatusValues)

const identifierSchema = z.string().trim().min(1).max(30)
const uniqueIdentifiersSchema = z.array(identifierSchema).transform(values => [...new Set(values)])

export const supervisionGroupCreateSchema = z.object({
  cycleId: identifierSchema,
  round: supervisionRoundSchema,
  name: z.string().trim().min(1).max(150),
  lecturerIds: uniqueIdentifiersSchema.pipe(z.array(identifierSchema).min(1)),
  companySiteIds: uniqueIdentifiersSchema.pipe(z.array(identifierSchema).min(1)),
})

export const appointmentParticipationSchema = z.object({
  appointmentId: identifierSchema,
})

export const appointmentScheduleUpdateSchema = z.object({
  scheduledDate: isoDateSchema,
  period: supervisionPeriodSchema,
  lecturerIds: uniqueIdentifiersSchema.pipe(z.array(identifierSchema).min(1)),
})

export const supervisionResultSchema = z.object({
  summary: z.string().trim().max(20_000).default(''),
  issues: z.string().trim().max(20_000).default(''),
  suggestions: z.string().trim().max(20_000).default(''),
  companyRequirements: z.string().trim().max(20_000).default(''),
})

export const appointmentCompletionSchema = appointmentScheduleUpdateSchema.extend({
  actualLecturerIds: uniqueIdentifiersSchema.pipe(z.array(identifierSchema).min(1)),
  result: supervisionResultSchema,
})

export const appointmentStatusTransitionSchema = z.object({
  fromStatus: supervisionAppointmentStatusSchema,
  toStatus: supervisionAppointmentStatusSchema,
  reason: z.string().trim().min(1).max(5_000).optional(),
})

export const confirmedPlacementReadModelSchema = z.object({
  placementRequestId: identifierSchema,
  cycleId: identifierSchema,
  studentUserId: identifierSchema,
  companySiteId: identifierSchema,
  confirmedAt: z.string().datetime({ offset: true }),
})

export type SupervisionRoundInput = z.infer<typeof supervisionRoundSchema>
export type SupervisionPeriodInput = z.infer<typeof supervisionPeriodSchema>
export type SupervisionAppointmentStatusInput = z.infer<typeof supervisionAppointmentStatusSchema>
export type SupervisionGroupCreateInput = z.infer<typeof supervisionGroupCreateSchema>
export type AppointmentScheduleUpdateInput = z.infer<typeof appointmentScheduleUpdateSchema>
export type AppointmentCompletionInput = z.infer<typeof appointmentCompletionSchema>
export type ConfirmedPlacementReadModel = z.infer<typeof confirmedPlacementReadModelSchema>
