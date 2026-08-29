export type CompanyStatus = 'active' | 'pending' | 'inactive'
export type PlacementStatus = 'draft' | 'submitted' | 'returned' | 'batched' | 'letter-issued' | 'cancelled'

export interface Company {
  id: string
  name: string
  branch: string
  address: string
  province: string
  region: string
  status: CompanyStatus
}

export interface PlacementTimelineItem {
  id: string
  title: string
  description: string
  createdAt: string
}

export interface PlacementRequest {
  id: string
  companyId: string
  position: string
  details: string
  appliedAt: string
  recipientName: string
  recipientRole: string
  letterAddress: string
  status: PlacementStatus
  returnReason?: string
  updatedAt: string
  timeline: PlacementTimelineItem[]
}

export interface PlacementFormValue {
  companyId: string
  position: string
  details: string
  appliedAt: string
  recipientName: string
  recipientRole: string
  letterAddress: string
}

export interface NewCompanyValue {
  name: string
  address: string
  province: string
}

const initialCompanies: Company[] = [
  {
    id: 'COM-001',
    name: 'บริษัท บุรีรัมย์ดิจิทัล จำกัด',
    branch: 'สำนักงานใหญ่',
    address: '88 ถนนจิระ ตำบลในเมือง อำเภอเมืองบุรีรัมย์',
    province: 'บุรีรัมย์',
    region: 'ภาคตะวันออกเฉียงเหนือ',
    status: 'active',
  },
  {
    id: 'COM-002',
    name: 'บริษัท อีสานเทค จำกัด',
    branch: 'สาขานครราชสีมา',
    address: '199 ถนนมิตรภาพ ตำบลในเมือง อำเภอเมืองนครราชสีมา',
    province: 'นครราชสีมา',
    region: 'ภาคตะวันออกเฉียงเหนือ',
    status: 'active',
  },
  {
    id: 'COM-003',
    name: 'บริษัท สยามอินโนเวชัน จำกัด',
    branch: 'สำนักงานใหญ่',
    address: '45 ถนนพหลโยธิน แขวงจอมพล เขตจตุจักร',
    province: 'กรุงเทพมหานคร',
    region: 'ภาคกลาง',
    status: 'pending',
  },
  {
    id: 'COM-004',
    name: 'บริษัท ตัวอย่างยุติการใช้งาน จำกัด',
    branch: 'สำนักงานใหญ่',
    address: '10 ตำบลในเมือง อำเภอเมืองขอนแก่น',
    province: 'ขอนแก่น',
    region: 'ภาคตะวันออกเฉียงเหนือ',
    status: 'inactive',
  },
]

const initialRequests: PlacementRequest[] = [
  {
    id: 'REQ-0269-018',
    companyId: 'COM-001',
    position: 'นักพัฒนาเว็บไซต์',
    details: 'พัฒนาและทดสอบระบบงานภายในด้วย Vue และ TypeScript',
    appliedAt: '2026-08-24',
    recipientName: 'ผู้จัดการฝ่ายทรัพยากรบุคคล',
    recipientRole: 'ฝ่ายทรัพยากรบุคคล',
    letterAddress: 'บริษัท บุรีรัมย์ดิจิทัล จำกัด 88 ถนนจิระ ตำบลในเมือง อำเภอเมืองบุรีรัมย์ จังหวัดบุรีรัมย์ 31000',
    status: 'cancelled',
    updatedAt: '2026-08-28T09:30:00+07:00',
    timeline: [
      { id: 'TL-018-4', title: 'ยกเลิกคำร้อง', description: 'คำร้องนี้สิ้นสุดแล้วและเก็บไว้เป็นประวัติ', createdAt: '2026-08-28T09:30:00+07:00' },
      { id: 'TL-018-3', title: 'รวมในชุดหนังสือแล้ว', description: 'อาจารย์รับคำร้องเข้าชุดหนังสือ คำร้องจึงถูกล็อกชั่วคราว', createdAt: '2026-08-27T09:30:00+07:00' },
      { id: 'TL-018-2', title: 'ส่งคำร้องแล้ว', description: 'ส่งข้อมูลให้อาจารย์ตรวจสอบ', createdAt: '2026-08-24T14:20:00+07:00' },
      { id: 'TL-018-1', title: 'สร้างฉบับร่าง', description: 'บันทึกข้อมูลคำร้องครั้งแรก', createdAt: '2026-08-24T13:55:00+07:00' },
    ],
  },
  {
    id: 'REQ-0269-006',
    companyId: 'COM-002',
    position: 'นักวิเคราะห์ข้อมูล',
    details: 'จัดเตรียมข้อมูลและสร้างรายงานสำหรับทีมวางแผนธุรกิจ',
    appliedAt: '2026-08-18',
    recipientName: 'คุณศุภชัย พัฒนกิจ',
    recipientRole: 'ผู้จัดการทั่วไป',
    letterAddress: 'บริษัท อีสานเทค จำกัด สาขานครราชสีมา 199 ถนนมิตรภาพ ตำบลในเมือง อำเภอเมืองนครราชสีมา จังหวัดนครราชสีมา 30000',
    status: 'returned',
    returnReason: 'กรุณาตรวจสอบชื่อตำแหน่งฝึกงานให้ตรงกับหนังสือตอบรับเบื้องต้น และแก้ชื่อผู้รับหนังสือเป็นผู้จัดการฝ่ายบุคคล',
    updatedAt: '2026-08-22T10:15:00+07:00',
    timeline: [
      { id: 'TL-006-3', title: 'ส่งกลับให้แก้ไข', description: 'อาจารย์พบข้อมูลที่ต้องปรับก่อนจัดทำหนังสือ', createdAt: '2026-08-22T10:15:00+07:00' },
      { id: 'TL-006-2', title: 'ส่งคำร้องแล้ว', description: 'ส่งข้อมูลให้อาจารย์ตรวจสอบ', createdAt: '2026-08-18T16:40:00+07:00' },
      { id: 'TL-006-1', title: 'สร้างฉบับร่าง', description: 'บันทึกข้อมูลคำร้องครั้งแรก', createdAt: '2026-08-18T16:10:00+07:00' },
    ],
  },
  {
    id: 'REQ-0269-002',
    companyId: 'COM-003',
    position: 'ผู้ช่วยออกแบบ UX/UI',
    details: 'ออกแบบต้นแบบและทดสอบการใช้งานผลิตภัณฑ์ดิจิทัล',
    appliedAt: '2026-08-12',
    recipientName: 'ผู้อำนวยการฝ่ายบุคคล',
    recipientRole: 'ฝ่ายทรัพยากรบุคคล',
    letterAddress: 'บริษัท สยามอินโนเวชัน จำกัด 45 ถนนพหลโยธิน แขวงจอมพล เขตจตุจักร กรุงเทพมหานคร 10900',
    status: 'cancelled',
    updatedAt: '2026-08-13T11:25:00+07:00',
    timeline: [
      { id: 'TL-002-3', title: 'ยกเลิกคำร้อง', description: 'คำร้องนี้สิ้นสุดแล้วและเก็บไว้เป็นประวัติ', createdAt: '2026-08-13T11:25:00+07:00' },
      { id: 'TL-002-2', title: 'ส่งคำร้องแล้ว', description: 'ส่งข้อมูลให้อาจารย์ตรวจสอบ พร้อมสถานประกอบการใหม่ที่รอตรวจสอบ', createdAt: '2026-08-12T11:25:00+07:00' },
      { id: 'TL-002-1', title: 'สร้างฉบับร่าง', description: 'บันทึกข้อมูลคำร้องครั้งแรก', createdAt: '2026-08-12T11:10:00+07:00' },
    ],
  },
]

const cloneCompanies = () => initialCompanies.map(company => ({ ...company }))
const cloneRequests = () => initialRequests.map(request => ({
  ...request,
  timeline: request.timeline.map(item => ({ ...item })),
}))

const provinceRegions: Record<string, string> = {
  กรุงเทพมหานคร: 'ภาคกลาง',
  บุรีรัมย์: 'ภาคตะวันออกเฉียงเหนือ',
  นครราชสีมา: 'ภาคตะวันออกเฉียงเหนือ',
  ขอนแก่น: 'ภาคตะวันออกเฉียงเหนือ',
  เชียงใหม่: 'ภาคเหนือ',
  ชลบุรี: 'ภาคตะวันออก',
  สงขลา: 'ภาคใต้',
  สุพรรณบุรี: 'ภาคกลาง',
}

export const placementStatusMeta: Record<PlacementStatus, { label: string, tone: 'neutral' | 'success' | 'warning' | 'danger' | 'info', nextStep: string }> = {
  draft: { label: 'ฉบับร่าง', tone: 'neutral', nextStep: 'กรอกข้อมูลให้ครบแล้วส่งคำร้อง' },
  submitted: { label: 'ส่งคำร้องแล้ว', tone: 'warning', nextStep: 'รออาจารย์ตรวจสอบข้อมูล' },
  returned: { label: 'ส่งกลับให้แก้ไข', tone: 'danger', nextStep: 'ตรวจเหตุผล แก้ข้อมูล แล้วส่งคำร้องอีกครั้ง' },
  batched: { label: 'รวมในชุดหนังสือแล้ว', tone: 'info', nextStep: 'รออาจารย์จัดทำหนังสือขอฝึกงาน' },
  'letter-issued': { label: 'ออกหนังสือแล้ว', tone: 'success', nextStep: 'ดาวน์โหลดหนังสือและนำส่งสถานประกอบการ' },
  cancelled: { label: 'ยกเลิกคำร้อง', tone: 'neutral', nextStep: 'รายการนี้สิ้นสุดแล้ว' },
}

export const companyStatusMeta: Record<CompanyStatus, { label: string, tone: 'success' | 'warning' | 'neutral' }> = {
  active: { label: 'ตรวจสอบแล้ว', tone: 'success' },
  pending: { label: 'รอตรวจสอบ', tone: 'warning' },
  inactive: { label: 'ยุติการใช้งาน', tone: 'neutral' },
}

export const useStudentPlacements = () => {
  const companies = useState<Company[]>('mock-placement-companies', cloneCompanies)
  const requests = useState<PlacementRequest[]>('mock-placement-requests', cloneRequests)
  const activeRequest = computed(() => requests.value.find(request => request.status !== 'cancelled'))

  const findCompany = (id: string) => companies.value.find(company => company.id === id)
  const findRequest = (id: string) => requests.value.find(request => request.id === id)

  const addCompany = (value: NewCompanyValue) => {
    const company: Company = {
      id: `COM-${String(companies.value.length + 1).padStart(3, '0')}`,
      ...value,
      branch: 'ไม่ระบุ',
      region: provinceRegions[value.province] ?? 'รอระบุภูมิภาค',
      status: 'pending',
    }
    companies.value.push(company)
    return company
  }

  const saveRequest = (value: PlacementFormValue, mode: 'draft' | 'submitted', requestId?: string) => {
    const now = new Date().toISOString()
    const existing = requestId ? findRequest(requestId) : undefined
    if (existing) {
      if (!['draft', 'submitted', 'returned'].includes(existing.status)) {
        throw new Error('placement-request-not-editable')
      }
      Object.assign(existing, value, {
        status: mode,
        returnReason: undefined,
        updatedAt: now,
      })
      existing.timeline.unshift({
        id: crypto.randomUUID(),
        title: mode === 'submitted' ? 'ส่งคำร้องอีกครั้ง' : 'แก้ไขฉบับร่าง',
        description: mode === 'submitted' ? 'บันทึกข้อมูลที่แก้ไขและส่งให้อาจารย์ตรวจสอบ' : 'บันทึกข้อมูลล่าสุดไว้เป็นฉบับร่าง',
        createdAt: now,
      })
      return existing
    }

    if (activeRequest.value) {
      throw new Error('active-placement-request-exists')
    }

    const request: PlacementRequest = {
      id: `REQ-0269-${String(requests.value.length + 21).padStart(3, '0')}`,
      ...value,
      status: mode,
      updatedAt: now,
      timeline: [{
        id: crypto.randomUUID(),
        title: mode === 'submitted' ? 'ส่งคำร้องแล้ว' : 'สร้างฉบับร่าง',
        description: mode === 'submitted' ? 'ส่งข้อมูลให้อาจารย์ตรวจสอบ' : 'บันทึกข้อมูลคำร้องครั้งแรก',
        createdAt: now,
      }],
    }
    requests.value.unshift(request)
    return request
  }

  const cancelRequest = (id: string) => {
    const request = findRequest(id)
    if (!request || !['draft', 'submitted', 'returned'].includes(request.status)) return false
    request.status = 'cancelled'
    request.updatedAt = new Date().toISOString()
    request.timeline.unshift({
      id: crypto.randomUUID(),
      title: 'ยกเลิกคำร้อง',
      description: 'นักศึกษายกเลิกคำร้องผ่านระบบ',
      createdAt: request.updatedAt,
    })
    return true
  }

  const resetPlacementData = () => {
    companies.value = cloneCompanies()
    requests.value = cloneRequests()
  }

  return { companies, requests, activeRequest, findCompany, findRequest, addCompany, saveRequest, cancelRequest, resetPlacementData }
}
