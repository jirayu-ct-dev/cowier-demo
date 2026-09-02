import { describe, expect, it } from 'vitest'
import {
  companyEvaluationSubmitSchema,
  studentEvaluationDraftSchema,
  studentEvaluationSubmitSchema,
} from './schema'
import {
  calculateEvaluationAverage,
  getEvaluationProgress,
  isEvaluationComplete,
} from './rules'

const completeStudentScores = {
  responsibilityScore: 5,
  disciplineScore: 4,
  communicationScore: 0,
  knowledgeScore: 3,
  workQualityScore: 4,
  problemSolvingScore: 5,
  safetyScore: 5,
}

const completeCompanyScores = {
  workRelevanceScore: 5,
  workChallengeScore: 4,
  supervisorReadinessScore: 4,
  studentSupportScore: 5,
  environmentSafetyScore: 5,
  resourceReadinessScore: 0,
  universityCoordinationScore: 4,
}

describe('evaluation rules', () => {
  it('excludes unanswered and not-applicable scores from the average', () => {
    expect(calculateEvaluationAverage([5, 3, 0, null])).toBe(4)
    expect(calculateEvaluationAverage([0, null])).toBeNull()
  })

  it('treats zero as answered and null as unanswered', () => {
    expect(isEvaluationComplete([1, 0, 5])).toBe(true)
    expect(isEvaluationComplete([1, null, 5])).toBe(false)
  })

  it('allows null scores in a draft but not in a submission', () => {
    const input = {
      scores: { ...completeStudentScores, safetyScore: null },
    }

    expect(studentEvaluationDraftSchema.safeParse(input).success).toBe(true)
    expect(studentEvaluationSubmitSchema.safeParse(input).success).toBe(false)
    expect(studentEvaluationSubmitSchema.safeParse({ scores: completeStudentScores }).success).toBe(true)
  })

  it('requires a company recommendation when submitting', () => {
    expect(companyEvaluationSubmitSchema.safeParse({
      scores: completeCompanyScores,
      recommendation: null,
    }).success).toBe(false)
    expect(companyEvaluationSubmitSchema.safeParse({
      scores: completeCompanyScores,
      recommendation: 'recommended',
    }).success).toBe(true)
  })

  it('derives progress without allowing impossible counts', () => {
    expect(getEvaluationProgress(0, 3)).toBe('not_started')
    expect(getEvaluationProgress(1, 3)).toBe('in_progress')
    expect(getEvaluationProgress(3, 3)).toBe('completed')
    expect(() => getEvaluationProgress(4, 3)).toThrow('evaluation-progress-out-of-range')
  })
})
