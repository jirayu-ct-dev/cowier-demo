export type EvaluationRating = '1' | '2' | '3' | '4' | '5' | 'na'
export type EvaluationStatus = 'draft' | 'submitted'
export type CompanyRecommendation = 'recommended' | 'conditional' | 'follow_up' | 'not_recommended' | 'safety_risk'

export interface EvaluationCriterion {
  id: string
  label: string
}

export interface StudentEvaluationInput {
  ratings: Record<string, EvaluationRating>
  strengths: string
  issues: string
  suggestions: string
  followUp: string
}

export interface StudentEvaluation extends StudentEvaluationInput {
  appointmentId: string
  studentId: string
  lecturerId: string
  status: EvaluationStatus
  submittedAt: string | null
}

export interface CompanyEvaluationInput {
  ratings: Record<string, EvaluationRating>
  recommendation: CompanyRecommendation | ''
  observations: string
  companyRequirements: string
  issues: string
  suggestions: string
}

export interface CompanyEvaluation extends CompanyEvaluationInput {
  appointmentId: string
  evaluatorId: string
  status: EvaluationStatus
  submittedAt: string | null
}

export const evaluationRatingOptions = [
  { value: '1', label: '1 · ต้องปรับปรุงอย่างมาก' },
  { value: '2', label: '2 · ต้องปรับปรุง' },
  { value: '3', label: '3 · ผ่านตามเกณฑ์' },
  { value: '4', label: '4 · ดี' },
  { value: '5', label: '5 · ดีมาก' },
  { value: 'na', label: 'N/A · ไม่สามารถประเมินได้' },
]

export const companyRecommendationOptions = [
  { value: 'recommended', label: 'แนะนำให้ส่งนักศึกษารุ่นถัดไป' },
  { value: 'conditional', label: 'แนะนำแบบมีเงื่อนไข' },
  { value: 'follow_up', label: 'ต้องติดตามข้อมูลเพิ่มเติม' },
  { value: 'not_recommended', label: 'ไม่แนะนำ' },
  { value: 'safety_risk', label: 'มีประเด็นเร่งด่วนด้านความปลอดภัย' },
]

export const studentEvaluationCriteria: EvaluationCriterion[] = [
  { id: 'responsibility', label: 'ความรับผิดชอบและตรงต่อเวลา' },
  { id: 'ethics', label: 'วินัยและจรรยาบรรณในการทำงาน' },
  { id: 'communication', label: 'การสื่อสารและทำงานร่วมกับผู้อื่น' },
  { id: 'knowledge', label: 'การประยุกต์ใช้ความรู้กับงาน' },
  { id: 'work_quality', label: 'คุณภาพและความก้าวหน้าของงาน' },
  { id: 'problem_solving', label: 'การเรียนรู้และแก้ไขปัญหา' },
  { id: 'safety', label: 'การปฏิบัติตามกฎและความปลอดภัย' },
]

export const companyEvaluationCriteria: EvaluationCriterion[] = [
  { id: 'field_relevance', label: 'งานตรงหรือสัมพันธ์กับสาขาวิชา' },
  { id: 'work_scope', label: 'ปริมาณและความท้าทายของงานเหมาะสม' },
  { id: 'supervisor_readiness', label: 'ผู้ควบคุมงานพร้อมให้คำแนะนำ' },
  { id: 'student_support', label: 'มีการดูแลและติดตามนักศึกษา' },
  { id: 'environment', label: 'สภาพแวดล้อมและความปลอดภัยเหมาะสม' },
  { id: 'resources', label: 'อุปกรณ์และทรัพยากรเพียงพอ' },
  { id: 'coordination', label: 'การประสานงานกับมหาวิทยาลัย' },
]

const hasCompleteRatings = (ratings: Record<string, EvaluationRating>, criteria: EvaluationCriterion[]) => criteria
  .every(criterion => Boolean(ratings[criterion.id]))

export const calculateEvaluationAverage = (ratings: Record<string, EvaluationRating>) => {
  const scores = Object.values(ratings).filter((rating): rating is Exclude<EvaluationRating, 'na'> => rating !== 'na').map(Number)
  if (!scores.length) return null
  return scores.reduce((total, score) => total + score, 0) / scores.length
}

export const useSupervisionEvaluations = () => {
  const studentEvaluations = useState<StudentEvaluation[]>('supervision-student-evaluations-v1', () => [])
  const companyEvaluations = useState<CompanyEvaluation[]>('supervision-company-evaluations-v1', () => [])
  const { recordEvent } = useScenario()

  const getStudentEvaluation = (appointmentId: string, studentId: string, lecturerId: string) => studentEvaluations.value
    .find(item => item.appointmentId === appointmentId && item.studentId === studentId && item.lecturerId === lecturerId) ?? null

  const saveStudentEvaluation = (appointmentId: string, studentId: string, lecturerId: string, input: StudentEvaluationInput) => {
    const existing = getStudentEvaluation(appointmentId, studentId, lecturerId)
    if (existing?.status === 'submitted') throw new Error('evaluation-locked')
    const evaluation: StudentEvaluation = {
      appointmentId,
      studentId,
      lecturerId,
      ...structuredClone(input),
      status: 'draft',
      submittedAt: null,
    }
    if (existing) Object.assign(existing, evaluation)
    else studentEvaluations.value.push(evaluation)
    recordEvent(`บันทึกร่างแบบประเมินนักศึกษา ${studentId}`)
    return existing ?? evaluation
  }

  const submitStudentEvaluation = (appointmentId: string, studentId: string, lecturerId: string, input: StudentEvaluationInput) => {
    if (!hasCompleteRatings(input.ratings, studentEvaluationCriteria)) throw new Error('ratings-incomplete')
    const evaluation = saveStudentEvaluation(appointmentId, studentId, lecturerId, input)
    evaluation.status = 'submitted'
    evaluation.submittedAt = new Date().toISOString()
    recordEvent(`ส่งแบบประเมินนักศึกษา ${studentId}`)
    return evaluation
  }

  const getCompanyEvaluation = (appointmentId: string) => companyEvaluations.value
    .find(item => item.appointmentId === appointmentId) ?? null

  const saveCompanyEvaluation = (appointmentId: string, evaluatorId: string, input: CompanyEvaluationInput) => {
    const existing = getCompanyEvaluation(appointmentId)
    if (existing?.status === 'submitted') throw new Error('evaluation-locked')
    const evaluation: CompanyEvaluation = {
      appointmentId,
      evaluatorId,
      ...structuredClone(input),
      status: 'draft',
      submittedAt: null,
    }
    if (existing) Object.assign(existing, evaluation)
    else companyEvaluations.value.push(evaluation)
    recordEvent(`บันทึกร่างแบบประเมินสถานประกอบการ ${appointmentId}`)
    return existing ?? evaluation
  }

  const submitCompanyEvaluation = (appointmentId: string, evaluatorId: string, input: CompanyEvaluationInput) => {
    if (!hasCompleteRatings(input.ratings, companyEvaluationCriteria)) throw new Error('ratings-incomplete')
    if (!input.recommendation) throw new Error('recommendation-required')
    const evaluation = saveCompanyEvaluation(appointmentId, evaluatorId, input)
    evaluation.status = 'submitted'
    evaluation.submittedAt = new Date().toISOString()
    recordEvent(`ส่งแบบประเมินสถานประกอบการ ${appointmentId}`)
    return evaluation
  }

  return {
    studentEvaluations,
    companyEvaluations,
    getStudentEvaluation,
    saveStudentEvaluation,
    submitStudentEvaluation,
    getCompanyEvaluation,
    saveCompanyEvaluation,
    submitCompanyEvaluation,
  }
}
