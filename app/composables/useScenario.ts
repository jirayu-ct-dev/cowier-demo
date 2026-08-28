export type ScenarioViewState = 'data' | 'loading' | 'empty' | 'error'
export type ScenarioRole = 'staff' | 'lecturer' | 'student'

export interface ScenarioState {
  role: ScenarioRole
  userName: string
  cycle: string
  viewState: ScenarioViewState
}

const defaults: ScenarioState = {
  role: 'staff',
  userName: 'นางสาวพิมพ์ชนก ใจดี',
  cycle: 'ภาคเรียนที่ 2/2569',
  viewState: 'data',
}

export const useScenario = () => {
  const scenario = useState<ScenarioState>('dev-scenario', () => ({ ...defaults }))

  const resetScenario = () => {
    scenario.value = { ...defaults }
  }

  return { scenario, resetScenario }
}
