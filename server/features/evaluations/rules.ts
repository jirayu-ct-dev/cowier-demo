import type { EvaluationScore } from './schema'

export const isEvaluationComplete = (scores: readonly EvaluationScore[]) => scores.every(score => score !== null)

export const calculateEvaluationAverage = (scores: readonly EvaluationScore[]) => {
  const ratedScores = scores.filter((score): score is Exclude<EvaluationScore, null | 0> => score !== null && score !== 0)
  if (!ratedScores.length) return null

  return ratedScores.reduce((total, score) => total + score, 0) / ratedScores.length
}

export const getEvaluationProgress = (submittedCount: number, requiredCount: number) => {
  if (requiredCount < 0 || submittedCount < 0 || submittedCount > requiredCount) {
    throw new RangeError('evaluation-progress-out-of-range')
  }
  if (submittedCount === 0) return 'not_started' as const
  if (submittedCount === requiredCount) return 'completed' as const
  return 'in_progress' as const
}
