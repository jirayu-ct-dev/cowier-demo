import { describe, expect, it } from 'vitest'
import { calculateEvaluationAverage } from './useSupervisionEvaluations'

describe('calculateEvaluationAverage', () => {
  it('excludes ratings that cannot be evaluated', () => {
    expect(calculateEvaluationAverage({ responsibility: '5', ethics: '3', safety: 'na' })).toBe(4)
  })

  it('returns null when every criterion is unavailable', () => {
    expect(calculateEvaluationAverage({ responsibility: 'na', ethics: 'na' })).toBeNull()
  })
})
