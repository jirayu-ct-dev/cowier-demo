import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { calculateEvaluationAverage, companyEvaluationCriteria, useSupervisionEvaluations } from './useSupervisionEvaluations'

describe('calculateEvaluationAverage', () => {
  it('excludes ratings that cannot be evaluated', () => {
    expect(calculateEvaluationAverage({ responsibility: '5', ethics: '3', safety: 'na' })).toBe(4)
  })

  it('returns null when every criterion is unavailable', () => {
    expect(calculateEvaluationAverage({ responsibility: 'na', ethics: 'na' })).toBeNull()
  })
})

describe('company evaluation roles', () => {
  const account = ref<{ role: 'staff' | 'lecturer' | 'student' }>({ role: 'staff' })

  beforeEach(() => {
    const state = new Map<string, ReturnType<typeof ref>>()
    vi.stubGlobal('useState', (key: string, init: () => unknown) => {
      if (!state.has(key)) state.set(key, ref(init()))
      return state.get(key)
    })
    vi.stubGlobal('useScenario', () => ({ recordEvent: vi.fn() }))
    vi.stubGlobal('useAuthPrototype', () => ({ currentAccount: account }))
    account.value = { role: 'staff' }
  })

  afterEach(() => vi.unstubAllGlobals())

  const input = () => ({
    ratings: Object.fromEntries(companyEvaluationCriteria.map(criterion => [criterion.id, '4' as const])),
    recommendation: 'recommended' as const,
    observations: 'สภาพแวดล้อมเหมาะสม',
    companyRequirements: '',
    issues: '',
    suggestions: 'มีที่พักใกล้สถานประกอบการ',
  })

  it.each(['staff', 'lecturer'] as const)('allows %s to submit the shared company evaluation', (role) => {
    account.value = { role }
    const store = useSupervisionEvaluations()
    expect(store.submitCompanyEvaluation('A1', `${role}-1`, input())).toMatchObject({ status: 'submitted', evaluatorId: `${role}-1` })
  })

  it('blocks students and locks the evaluation after the first submission', () => {
    const store = useSupervisionEvaluations()
    store.submitCompanyEvaluation('A1', 'staff-1', input())
    account.value = { role: 'student' }
    expect(() => store.submitCompanyEvaluation('A2', 'student-1', input())).toThrow('ไม่มีสิทธิ์')
    account.value = { role: 'lecturer' }
    expect(() => store.submitCompanyEvaluation('A1', 'lecturer-1', input())).toThrow('evaluation-locked')
  })
})
