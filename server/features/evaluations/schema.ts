import { z } from 'zod'

export const evaluationStatusValues = ['draft', 'submitted'] as const
export const companyRecommendationValues = ['recommended', 'conditional', 'follow_up', 'not_recommended', 'safety_risk'] as const

export const evaluationStatusSchema = z.enum(evaluationStatusValues)
export const companyRecommendationSchema = z.enum(companyRecommendationValues)
export const evaluationScoreSchema = z.number().int().min(0).max(5).nullable()

export const studentEvaluationScoresSchema = z.object({
  responsibilityScore: evaluationScoreSchema,
  disciplineScore: evaluationScoreSchema,
  communicationScore: evaluationScoreSchema,
  knowledgeScore: evaluationScoreSchema,
  workQualityScore: evaluationScoreSchema,
  problemSolvingScore: evaluationScoreSchema,
  safetyScore: evaluationScoreSchema,
})

export const companyEvaluationScoresSchema = z.object({
  workRelevanceScore: evaluationScoreSchema,
  workChallengeScore: evaluationScoreSchema,
  supervisorReadinessScore: evaluationScoreSchema,
  studentSupportScore: evaluationScoreSchema,
  environmentSafetyScore: evaluationScoreSchema,
  resourceReadinessScore: evaluationScoreSchema,
  universityCoordinationScore: evaluationScoreSchema,
})

const optionalEvaluationTextSchema = z.string().trim().max(20_000).default('')

export const studentEvaluationDraftSchema = z.object({
  scores: studentEvaluationScoresSchema,
  strengths: optionalEvaluationTextSchema,
  issues: optionalEvaluationTextSchema,
  suggestions: optionalEvaluationTextSchema,
  nextFollowUp: optionalEvaluationTextSchema,
})

export const studentEvaluationSubmitSchema = studentEvaluationDraftSchema.superRefine((input, context) => {
  Object.entries(input.scores).forEach(([field, score]) => {
    if (score === null) {
      context.addIssue({
        code: 'custom',
        path: ['scores', field],
        message: 'ต้องให้คะแนนหรือเลือกไม่สามารถประเมินได้',
      })
    }
  })
})

export const companyEvaluationDraftSchema = z.object({
  scores: companyEvaluationScoresSchema,
  recommendation: companyRecommendationSchema.nullable(),
  observations: optionalEvaluationTextSchema,
  issues: optionalEvaluationTextSchema,
  suggestions: optionalEvaluationTextSchema,
})

export const companyEvaluationSubmitSchema = companyEvaluationDraftSchema.superRefine((input, context) => {
  Object.entries(input.scores).forEach(([field, score]) => {
    if (score === null) {
      context.addIssue({
        code: 'custom',
        path: ['scores', field],
        message: 'ต้องให้คะแนนหรือเลือกไม่สามารถประเมินได้',
      })
    }
  })
  if (input.recommendation === null) {
    context.addIssue({
      code: 'custom',
      path: ['recommendation'],
      message: 'ต้องระบุคำแนะนำสำหรับการรับนักศึกษารุ่นถัดไป',
    })
  }
})

export type EvaluationScore = z.infer<typeof evaluationScoreSchema>
export type StudentEvaluationScores = z.infer<typeof studentEvaluationScoresSchema>
export type CompanyEvaluationScores = z.infer<typeof companyEvaluationScoresSchema>
export type StudentEvaluationDraftInput = z.infer<typeof studentEvaluationDraftSchema>
export type CompanyEvaluationDraftInput = z.infer<typeof companyEvaluationDraftSchema>
