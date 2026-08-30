import type { StudentSection } from './usePeopleDirectory'

export const getStudentCohortYear = (studentId: string): string => {
  const shortYear = studentId.match(/^(\d{2})/)?.[1]
  return shortYear ? `25${shortYear}` : 'ไม่ระบุรุ่น'
}

export const getStudentSemester = (cycle?: string): string => cycle?.split('/')[0] ?? 'ไม่ระบุภาคเรียน'

export const useStudentCohortContext = () => {
  const { people } = usePeopleDirectory()
  const studentCohort = useState<string>('student-context-cohort', () => 'all')
  const studentSection = useState<string>('student-context-section', () => 'all')
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
  const studentSectionOptions = computed(() => {
    const sections = [...new Set(people.value
      .filter(person => person.type === 'student')
      .filter(person => studentCohort.value === 'all' || getStudentCohortYear(person.id) === studentCohort.value)
      .map(person => person.section)
      .filter((section): section is StudentSection => Boolean(section)))]
      .sort((a, b) => a.localeCompare(b, 'th', { numeric: true }))

    return [
      { value: 'all', label: 'ทุกหมู่' },
      ...sections.map(section => ({ value: section, label: section })),
    ]
  })
  const selectedStudentSectionLabel = computed(() => studentSectionOptions.value
    .find(option => option.value === studentSection.value)?.label ?? 'ทุกหมู่')
  const studentSemesterOptions = computed(() => {
    const semesters = [...new Set(people.value
      .filter(person => person.type === 'student')
      .filter(person => studentCohort.value === 'all' || getStudentCohortYear(person.id) === studentCohort.value)
      .filter(person => studentSection.value === 'all' || person.section === studentSection.value)
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
  const ensureAvailableStudentFilters = () => {
    if (!studentSectionOptions.value.some(option => option.value === studentSection.value)) {
      studentSection.value = 'all'
    }
    if (!studentSemesterOptions.value.some(option => option.value === studentSemester.value)) {
      studentSemester.value = 'all'
    }
  }

  return {
    studentCohort,
    studentCohortOptions,
    studentSection,
    studentSectionOptions,
    studentSemester,
    studentSemesterOptions,
    ensureAvailableStudentFilters,
    selectedStudentCohortLabel,
    selectedStudentSectionLabel,
    selectedStudentSemesterLabel,
  }
}
