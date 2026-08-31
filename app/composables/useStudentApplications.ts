export type TrackedApplicationStatus =
  | 'submitted'
  | 'waiting-response'
  | 'responded'
  | 'waiting-interview'
  | 'accepted'
  | 'rejected'

export interface StudentApplication {
  id: string
  studentId: string
  companyName: string
  position: string
  province: string
  appliedAt: string
  status: TrackedApplicationStatus
  updatedAt: string
}

export interface StudentApplicationFormValue {
  companyName: string
  position: string
  province: string
  appliedAt: string
  status: TrackedApplicationStatus
}

type ApplicationBadgeTone = 'neutral' | 'success' | 'warning' | 'danger' | 'info' | 'interview'

export const trackedApplicationStatusMeta: Record<TrackedApplicationStatus, { label: string, tone: ApplicationBadgeTone }> = {
  submitted: { label: 'ยื่นสมัครแล้ว', tone: 'neutral' },
  'waiting-response': { label: 'รอการตอบกลับ', tone: 'warning' },
  responded: { label: 'บริษัทตอบกลับแล้ว', tone: 'info' },
  'waiting-interview': { label: 'รอสัมภาษณ์', tone: 'interview' },
  accepted: { label: 'ผ่านการสมัคร', tone: 'success' },
  rejected: { label: 'ปฏิเสธ', tone: 'danger' },
}

export const trackedApplicationStatusOptions = Object.entries(trackedApplicationStatusMeta).map(([value, meta]) => ({
  value,
  label: meta.label,
}))

const initialApplications: StudentApplication[] = [
  { id: 'APP-001', studentId: '66123456701', companyName: 'บริษัท บุรีรัมย์ดิจิทัล จำกัด', position: 'นักพัฒนาเว็บไซต์', province: 'บุรีรัมย์', appliedAt: '2026-08-25', status: 'waiting-response', updatedAt: '2026-08-25T09:15:00+07:00' },
  { id: 'APP-002', studentId: '66123456701', companyName: 'บริษัท อีสานเทค จำกัด', position: 'นักวิเคราะห์ข้อมูล', province: 'นครราชสีมา', appliedAt: '2026-08-22', status: 'waiting-interview', updatedAt: '2026-08-28T13:30:00+07:00' },
  { id: 'APP-003', studentId: '66123456701', companyName: 'บริษัท สยามอินโนเวชัน จำกัด', position: 'ผู้ช่วยออกแบบ UX/UI', province: 'กรุงเทพมหานคร', appliedAt: '2026-08-19', status: 'responded', updatedAt: '2026-08-27T10:45:00+07:00' },
  { id: 'APP-004', studentId: '66123456701', companyName: 'บริษัท ชลบุรีซอฟต์แวร์ จำกัด', position: 'นักทดสอบซอฟต์แวร์', province: 'ชลบุรี', appliedAt: '2026-08-15', status: 'accepted', updatedAt: '2026-08-26T16:20:00+07:00' },
  { id: 'APP-005', studentId: '66123456701', companyName: 'บริษัท เชียงใหม่ครีเอทีฟ จำกัด', position: 'ผู้ช่วยนักออกแบบกราฟิก', province: 'เชียงใหม่', appliedAt: '2026-08-12', status: 'rejected', updatedAt: '2026-08-24T11:00:00+07:00' },
  { id: 'APP-006', studentId: '66123456701', companyName: 'บริษัท ขอนแก่นคลาวด์ จำกัด', position: 'ผู้ช่วยวิศวกรระบบ', province: 'ขอนแก่น', appliedAt: '2026-08-29', status: 'submitted', updatedAt: '2026-08-29T14:10:00+07:00' },
  { id: 'APP-007', studentId: '66123456702', companyName: 'บริษัท อีสานดิจิทัล จำกัด', position: 'Software Tester', province: 'บุรีรัมย์', appliedAt: '2026-08-27', status: 'waiting-interview', updatedAt: '2026-08-30T10:25:00+07:00' },
  { id: 'APP-008', studentId: '66123456702', companyName: 'บริษัท โคราชอินโนเวชัน จำกัด', position: 'Junior QA', province: 'นครราชสีมา', appliedAt: '2026-08-21', status: 'rejected', updatedAt: '2026-08-28T15:20:00+07:00' },
  { id: 'APP-009', studentId: '66123456704', companyName: 'บริษัท บุรีรัมย์เว็บ จำกัด', position: 'Web Developer', province: 'บุรีรัมย์', appliedAt: '2026-08-26', status: 'waiting-response', updatedAt: '2026-08-26T11:45:00+07:00' },
  { id: 'APP-010', studentId: '66123456708', companyName: 'บริษัท สยามดาต้า จำกัด', position: 'Data Engineer Intern', province: 'กรุงเทพมหานคร', appliedAt: '2026-08-24', status: 'responded', updatedAt: '2026-08-29T09:40:00+07:00' },
  { id: 'APP-011', studentId: '66123456725', companyName: 'บริษัท ภูเก็ตครีเอทีฟ จำกัด', position: 'Content Designer', province: 'ภูเก็ต', appliedAt: '2026-08-23', status: 'submitted', updatedAt: '2026-08-23T14:30:00+07:00' },
  { id: 'APP-012', studentId: '66123456746', companyName: 'บริษัท เชียงใหม่ซอฟต์แวร์ จำกัด', position: 'Frontend Developer', province: 'เชียงใหม่', appliedAt: '2026-08-20', status: 'accepted', updatedAt: '2026-08-30T16:00:00+07:00' },
]

const cloneApplications = () => initialApplications.map(application => ({ ...application }))

export const useStudentApplications = () => {
  const currentStudentId = '66123456701'
  const applications = useState<StudentApplication[]>('mock-student-applications', cloneApplications)
  const currentStudentApplications = computed(() => applications.value.filter(application => application.studentId === currentStudentId))
  const getStudentApplications = (studentId: string) => applications.value.filter(application => application.studentId === studentId)

  const addApplication = (value: StudentApplicationFormValue) => {
    const now = new Date().toISOString()
    const application: StudentApplication = {
      id: `APP-${String(applications.value.length + 1).padStart(3, '0')}`,
      studentId: currentStudentId,
      ...value,
      updatedAt: now,
    }
    applications.value.unshift(application)
    return application
  }

  const updateApplication = (id: string, value: StudentApplicationFormValue) => {
    const application = applications.value.find(item => item.id === id)
    if (!application) throw new Error('student-application-not-found')
    Object.assign(application, value, { updatedAt: new Date().toISOString() })
    return application
  }

  const updateApplicationStatus = (id: string, status: TrackedApplicationStatus) => {
    const application = applications.value.find(item => item.id === id)
    if (!application) throw new Error('student-application-not-found')
    application.status = status
    application.updatedAt = new Date().toISOString()
    return application
  }

  const deleteApplication = (id: string) => {
    const index = applications.value.findIndex(item => item.id === id)
    if (index < 0) throw new Error('student-application-not-found')
    applications.value.splice(index, 1)
  }

  const resetApplications = () => {
    applications.value = cloneApplications()
  }

  return {
    applications,
    currentStudentApplications,
    getStudentApplications,
    addApplication,
    updateApplication,
    updateApplicationStatus,
    deleteApplication,
    resetApplications,
  }
}
