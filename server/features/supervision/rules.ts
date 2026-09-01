import type {
  AppointmentCompletionInput,
  SupervisionAppointmentStatusInput,
  SupervisionGroupCreateInput,
} from './schema'

const allowedAppointmentTransitions = {
  draft: ['published', 'cancelled'],
  published: ['postponed', 'completed', 'cancelled'],
  postponed: ['published', 'cancelled'],
  completed: [],
  cancelled: [],
} as const satisfies Record<SupervisionAppointmentStatusInput, readonly SupervisionAppointmentStatusInput[]>

export interface ExistingGroupAssignment {
  cycleId: string
  round: 1 | 2
  lecturerIds: readonly string[]
  companySiteIds: readonly string[]
}

export interface GroupAssignmentConflicts {
  lecturerIds: string[]
  companySiteIds: string[]
}

export const canTransitionAppointmentStatus = (
  fromStatus: SupervisionAppointmentStatusInput,
  toStatus: SupervisionAppointmentStatusInput,
) => allowedAppointmentTransitions[fromStatus].some(status => status === toStatus)

export const isAppointmentLocked = (status: SupervisionAppointmentStatusInput) => status === 'completed' || status === 'cancelled'

export const findGroupAssignmentConflicts = (
  input: SupervisionGroupCreateInput,
  existingAssignments: readonly ExistingGroupAssignment[],
): GroupAssignmentConflicts => {
  const relevantAssignments = existingAssignments.filter(assignment => (
    assignment.cycleId === input.cycleId && assignment.round === input.round
  ))
  const assignedLecturerIds = new Set(relevantAssignments.flatMap(assignment => assignment.lecturerIds))
  const assignedCompanySiteIds = new Set(relevantAssignments.flatMap(assignment => assignment.companySiteIds))

  return {
    lecturerIds: input.lecturerIds.filter(id => assignedLecturerIds.has(id)),
    companySiteIds: input.companySiteIds.filter(id => assignedCompanySiteIds.has(id)),
  }
}

export const validateAppointmentCompletion = (
  input: AppointmentCompletionInput,
  plannedLecturerIds: readonly string[],
) => {
  const plannedLecturers = new Set(plannedLecturerIds)
  const invalidActualLecturerIds = input.actualLecturerIds.filter(id => !plannedLecturers.has(id))

  return {
    valid: invalidActualLecturerIds.length === 0,
    invalidActualLecturerIds,
  }
}

export const canManageAppointment = (
  lecturerId: string,
  responsibleLecturerIds: readonly string[],
  participatingLecturerIds: readonly string[],
) => responsibleLecturerIds.includes(lecturerId) || participatingLecturerIds.includes(lecturerId)
