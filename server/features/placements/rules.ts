import type { PublicUserRole } from '../auth/types'
import type { PlacementRequestStatusInput } from './schema'

const allowedPlacementTransitions = {
  draft: ['submitted', 'cancelled'],
  submitted: ['draft', 'returned', 'batched', 'cancelled'],
  returned: ['draft', 'submitted', 'cancelled'],
  batched: ['submitted', 'waiting-response'],
  'waiting-response': ['waiting-review'],
  'waiting-review': ['waiting-response', 'confirmed', 'not-accepted'],
  confirmed: [],
  'not-accepted': [],
  cancelled: [],
} as const satisfies Record<PlacementRequestStatusInput, readonly PlacementRequestStatusInput[]>

const activePlacementStatuses = new Set<PlacementRequestStatusInput>([
  'draft',
  'submitted',
  'returned',
  'batched',
  'waiting-response',
  'waiting-review',
])

export const canTransitionPlacementRequest = (
  fromStatus: PlacementRequestStatusInput,
  toStatus: PlacementRequestStatusInput,
) => allowedPlacementTransitions[fromStatus].some(status => status === toStatus)

export const placementActiveSlotKey = (
  status: PlacementRequestStatusInput,
  studentUserId: string,
) => activePlacementStatuses.has(status) ? studentUserId : null

export const placementConfirmedSlotKey = (
  status: PlacementRequestStatusInput,
  enrollmentId: string,
) => status === 'confirmed' ? enrollmentId : null

export const canManagePlacementDocuments = (
  role: PublicUserRole,
  canReviewPlacements: boolean,
) => role === 'lecturer' && canReviewPlacements
