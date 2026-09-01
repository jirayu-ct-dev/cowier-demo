import { z } from 'zod'

export const placementRequestStatusValues = [
  'draft',
  'submitted',
  'returned',
  'batched',
  'waiting-response',
  'waiting-review',
  'confirmed',
  'not-accepted',
  'cancelled',
] as const

export const letterBatchStatusValues = [
  'draft',
  'waiting-response',
  'waiting-review',
  'completed',
  'cancelled',
] as const

export const placementRequestStatusSchema = z.enum(placementRequestStatusValues)
export const letterBatchStatusSchema = z.enum(letterBatchStatusValues)

export type PlacementRequestStatusInput = z.infer<typeof placementRequestStatusSchema>
export type LetterBatchStatusInput = z.infer<typeof letterBatchStatusSchema>
