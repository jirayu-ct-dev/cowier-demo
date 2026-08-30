export const getStudentCohortYear = (studentId: string): string => {
  const shortYear = studentId.match(/^(\d{2})/)?.[1]
  return shortYear ? `25${shortYear}` : 'ไม่ระบุรุ่น'
}

export const getStudentSemester = (cycle?: string): string => cycle?.split('/')[0] ?? 'ไม่ระบุภาคเรียน'

export const useStudentCohortContext = () => {
  const { people } = usePeopleDirectory()
  const studentCohort = useState<string>('student-context-cohort', () => 'all')
  const studentSemester = useState<string>('student-context-semester', () => 'all')
  const studentCohortOptions = computed(() => {
    const years = [...new Set(people.value
      .filter(person => person.type === 'student')
      .map(person => getStudentCohortYear(person.id)))]
      .sort((a, b) => b.localeCompare(a, 'th'))

    return [
      { value: 'all', label: 'ทุกรุ่น' },
      ...years.map(year => ({ value: year, label: `รุ่นปี ${year}` })),
    ]
  })
  const selectedStudentCohortLabel = computed(() => studentCohortOptions.value
    .find(option => option.value === studentCohort.value)?.label ?? 'ทุกรุ่น')
  const studentSemesterOptions = computed(() => {
    const semesters = [...new Set(people.value
      .filter(person => person.type === 'student')
      .filter(person => studentCohort.value === 'all' || getStudentCohortYear(person.id) === studentCohort.value)
      .map(person => getStudentSemester(person.cycle)))]

    const semesterOrder = ['ภาคเรียนที่ 1', 'ภาคเรียนที่ 2', 'ภาคฤดูร้อน', 'ไม่ระบุภาคเรียน']
    semesters.sort((a, b) => semesterOrder.indexOf(a) - semesterOrder.indexOf(b))

    return [
      { value: 'all', label: 'ทุกภาคเรียน' },
      ...semesters.map(semester => ({ value: semester, label: semester })),
    ]
  })
  const selectedStudentSemesterLabel = computed(() => studentSemesterOptions.value
    .find(option => option.value === studentSemester.value)?.label ?? 'ทุกภาคเรียน')
  const ensureAvailableSemester = () => {
    if (!studentSemesterOptions.value.some(option => option.value === studentSemester.value)) {
      studentSemester.value = 'all'
    }
  }

  return {
    studentCohort,
    studentCohortOptions,
    studentSemester,
    studentSemesterOptions,
    ensureAvailableSemester,
    selectedStudentCohortLabel,
    selectedStudentSemesterLabel,
  }
}
