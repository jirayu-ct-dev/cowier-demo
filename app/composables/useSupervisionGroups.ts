export type SupervisionRound = 1 | 2

export interface SupervisionPlacement {
  id: string
  cycleId: string
  studentId: string
  studentName: string
  companyId: string
  company: string
  branch: string
  province: string
  region: string
  position: string
}

export interface SupervisionCompany {
  id: string
  cycleId: string
  name: string
  branch: string
  province: string
  region: string
  address: string
  contactName: string
  contactPhone: string
  studentCount: number
  students: Array<Pick<SupervisionPlacement, 'id' | 'studentId' | 'studentName' | 'position'>>
}

export interface SupervisionGroup {
  id: string
  cycleId: string
  round: SupervisionRound
  name: string
  lecturerIds: string[]
  companyIds: string[]
  createdAt: string
}

export interface SupervisionGroupInput {
  cycleId: string
  round: SupervisionRound
  name: string
  lecturerIds: string[]
  companyIds: string[]
}

const placementsSeed: SupervisionPlacement[] = [
  { id: 'SP-001', cycleId: 'CYCLE-2569-2', studentId: '66123456701', studentName: 'ธนกฤต พูนทรัพย์', companyId: 'SC-001', company: 'บริษัท สยามเทค โซลูชัน จำกัด', branch: 'สำนักงานใหญ่', province: 'บุรีรัมย์', region: 'ภาคตะวันออกเฉียงเหนือ', position: 'Frontend Developer' },
  { id: 'SP-002', cycleId: 'CYCLE-2569-2', studentId: '66123456702', studentName: 'ณัฐชา ศรีสุข', companyId: 'SC-001', company: 'บริษัท สยามเทค โซลูชัน จำกัด', branch: 'สำนักงานใหญ่', province: 'บุรีรัมย์', region: 'ภาคตะวันออกเฉียงเหนือ', position: 'Software Tester' },
  { id: 'SP-003', cycleId: 'CYCLE-2569-2', studentId: '66123456704', studentName: 'ภัทรวดี คำแสน', companyId: 'SC-002', company: 'บริษัท บุรีรัมย์เว็บ จำกัด', branch: 'สำนักงานใหญ่', province: 'บุรีรัมย์', region: 'ภาคตะวันออกเฉียงเหนือ', position: 'Web Developer' },
  { id: 'SP-004', cycleId: 'CYCLE-2569-2', studentId: '66123456708', studentName: 'ชยพล พรมดี', companyId: 'SC-003', company: 'บริษัท โคราชซอฟต์ จำกัด', branch: 'สำนักงานใหญ่', province: 'นครราชสีมา', region: 'ภาคตะวันออกเฉียงเหนือ', position: 'Backend Developer' },
  { id: 'SP-005', cycleId: 'CYCLE-2569-2', studentId: '66123456711', studentName: 'ปวีณ์นุช มั่นคง', companyId: 'SC-004', company: 'บริษัท อีสานเทค จำกัด', branch: 'สาขาขอนแก่น', province: 'ขอนแก่น', region: 'ภาคตะวันออกเฉียงเหนือ', position: 'UX/UI Designer' },
  { id: 'SP-006', cycleId: 'CYCLE-2569-2', studentId: '66123456715', studentName: 'นภัสสร มีสุข', companyId: 'SC-005', company: 'บริษัท นอร์ทเทิร์นดิจิทัล จำกัด', branch: 'สาขาเชียงใหม่', province: 'เชียงใหม่', region: 'ภาคเหนือ', position: 'Data Analyst' },
  { id: 'SP-007', cycleId: 'CYCLE-2569-2', studentId: '66123456720', studentName: 'ศุภกร รุ่งเรือง', companyId: 'SC-006', company: 'บริษัท บางกอกคลาวด์ จำกัด', branch: 'สำนักงานใหญ่', province: 'กรุงเทพมหานคร', region: 'ภาคกลาง', position: 'Cloud Engineer' },
  { id: 'SP-008', cycleId: 'CYCLE-2569-SUMMER', studentId: '66123456725', studentName: 'อรอนงค์ สายใจ', companyId: 'SC-007', company: 'บริษัท ภูเก็ตสมาร์ท จำกัด', branch: 'สำนักงานใหญ่', province: 'ภูเก็ต', region: 'ภาคใต้', position: 'Software Developer' },
  { id: 'SP-009', cycleId: 'CYCLE-2569-2', studentId: '66123456723', studentName: 'กิตติพงษ์ แสงทอง', companyId: 'SC-003', company: 'บริษัท โคราชซอฟต์ จำกัด', branch: 'สำนักงานใหญ่', province: 'นครราชสีมา', region: 'ภาคตะวันออกเฉียงเหนือ', position: 'DevOps Engineer' },
  { id: 'SP-010', cycleId: 'CYCLE-2569-2', studentId: '66123456727', studentName: 'พิชญา จันทร์ดี', companyId: 'SC-004', company: 'บริษัท อีสานเทค จำกัด', branch: 'สาขาขอนแก่น', province: 'ขอนแก่น', region: 'ภาคตะวันออกเฉียงเหนือ', position: 'Business Analyst' },
  { id: 'SP-011', cycleId: 'CYCLE-2569-2', studentId: '66123456731', studentName: 'รัฐภูมิ บุญมี', companyId: 'SC-004', company: 'บริษัท อีสานเทค จำกัด', branch: 'สาขาขอนแก่น', province: 'ขอนแก่น', region: 'ภาคตะวันออกเฉียงเหนือ', position: 'Mobile Developer' },
  { id: 'SP-012', cycleId: 'CYCLE-2569-2', studentId: '66123456734', studentName: 'ศิริพร มณีวงศ์', companyId: 'SC-006', company: 'บริษัท บางกอกคลาวด์ จำกัด', branch: 'สำนักงานใหญ่', province: 'กรุงเทพมหานคร', region: 'ภาคกลาง', position: 'System Engineer' },
  { id: 'SP-013', cycleId: 'CYCLE-2569-2', studentId: '66123456738', studentName: 'ธนภัทร วงศ์คำ', companyId: 'SC-008', company: 'บริษัท ศูนย์นวัตกรรมดิจิทัลภาคตะวันออก จำกัด', branch: 'สาขาชลบุรี', province: 'ชลบุรี', region: 'ภาคตะวันออก', position: 'AI Engineer' },
  { id: 'SP-014', cycleId: 'CYCLE-2569-2', studentId: '66123456742', studentName: 'ชนาภา สุขเกษม', companyId: 'SC-008', company: 'บริษัท ศูนย์นวัตกรรมดิจิทัลภาคตะวันออก จำกัด', branch: 'สาขาชลบุรี', province: 'ชลบุรี', region: 'ภาคตะวันออก', position: 'Data Engineer' },
  { id: 'SP-015', cycleId: 'CYCLE-2569-SUMMER', studentId: '66123456746', studentName: 'วรพล อินทร์แก้ว', companyId: 'SC-007', company: 'บริษัท ภูเก็ตสมาร์ท จำกัด', branch: 'สำนักงานใหญ่', province: 'ภูเก็ต', region: 'ภาคใต้', position: 'QA Engineer' },
]

const companyDetails: Record<string, Pick<SupervisionCompany, 'address' | 'contactName' | 'contactPhone'>> = {
  'SC-001': { address: '88/8 ถนนธานี ตำบลในเมือง อำเภอเมืองบุรีรัมย์ จังหวัดบุรีรัมย์ 31000', contactName: 'คุณกาญจนา วัฒนชัย', contactPhone: '044-611-208' },
  'SC-002': { address: '125 ถนนจิระ ตำบลในเมือง อำเภอเมืองบุรีรัมย์ จังหวัดบุรีรัมย์ 31000', contactName: 'คุณสุเมธ คงมั่น', contactPhone: '044-620-115' },
  'SC-003': { address: '299 ถนนมิตรภาพ ตำบลในเมือง อำเภอเมืองนครราชสีมา จังหวัดนครราชสีมา 30000', contactName: 'คุณปรีชา ศรีสุข', contactPhone: '044-255-901' },
  'SC-004': { address: '55/21 ถนนศรีจันทร์ ตำบลในเมือง อำเภอเมืองขอนแก่น จังหวัดขอนแก่น 40000', contactName: 'คุณอรอนงค์ แก้วใส', contactPhone: '043-225-478' },
  'SC-005': { address: '18 ถนนนิมมานเหมินท์ ตำบลสุเทพ อำเภอเมืองเชียงใหม่ จังหวัดเชียงใหม่ 50200', contactName: 'คุณธนกร พิทักษ์วงศ์', contactPhone: '053-218-644' },
  'SC-006': { address: '99 อาคารคลาวด์ทาวเวอร์ ถนนรัชดาภิเษก เขตดินแดง กรุงเทพมหานคร 10400', contactName: 'คุณณัฐพล พงษ์สวัสดิ์', contactPhone: '02-245-8890' },
  'SC-007': { address: '42 ถนนเทพกระษัตรี ตำบลตลาดใหญ่ อำเภอเมืองภูเก็ต จังหวัดภูเก็ต 83000', contactName: 'คุณสุนิสา รัตนกุล', contactPhone: '076-221-490' },
  'SC-008': { address: '700/12 นิคมอุตสาหกรรมอมตะซิตี้ ตำบลคลองตำหรุ อำเภอเมืองชลบุรี จังหวัดชลบุรี 20000', contactName: 'คุณภาคภูมิ วงศ์อนันต์', contactPhone: '038-458-721' },
}

const groupsSeed: SupervisionGroup[] = [
  { id: 'SG-001', cycleId: 'CYCLE-2569-2', round: 1, name: 'กลุ่มอาจารย์ 1', lecturerIds: ['L0012'], companyIds: ['SC-001', 'SC-002'], createdAt: '2026-08-29T10:00:00+07:00' },
  { id: 'SG-002', cycleId: 'CYCLE-2569-2', round: 2, name: 'กลุ่มอาจารย์ 1', lecturerIds: ['L0021'], companyIds: ['SC-001', 'SC-003'], createdAt: '2026-08-30T09:30:00+07:00' },
  { id: 'SG-003', cycleId: 'CYCLE-2569-2', round: 1, name: 'กลุ่มอาจารย์ 2', lecturerIds: ['L0021'], companyIds: ['SC-003'], createdAt: '2026-08-30T13:15:00+07:00' },
]

export const useSupervisionGroups = () => {
  const placements = useState<SupervisionPlacement[]>('supervision-placements-v3', () => structuredClone(placementsSeed))
  const groups = useState<SupervisionGroup[]>('supervision-groups-v3', () => structuredClone(groupsSeed))
  const { recordEvent } = useScenario()

  const getCompanies = (cycleId: string): SupervisionCompany[] => {
    const byCompany = new Map<string, SupervisionCompany>()
    placements.value.filter(item => item.cycleId === cycleId).forEach((placement) => {
      const company = byCompany.get(placement.companyId)
      const student = { id: placement.id, studentId: placement.studentId, studentName: placement.studentName, position: placement.position }
      if (company) {
        company.students.push(student)
        company.studentCount = company.students.length
        return
      }
      byCompany.set(placement.companyId, {
        id: placement.companyId,
        cycleId: placement.cycleId,
        name: placement.company,
        branch: placement.branch,
        province: placement.province,
        region: placement.region,
        address: companyDetails[placement.companyId]?.address ?? 'ยังไม่มีข้อมูลที่อยู่',
        contactName: companyDetails[placement.companyId]?.contactName ?? 'ยังไม่มีข้อมูลผู้ประสานงาน',
        contactPhone: companyDetails[placement.companyId]?.contactPhone ?? 'ยังไม่มีข้อมูลเบอร์โทรศัพท์',
        studentCount: 1,
        students: [student],
      })
    })
    return [...byCompany.values()]
  }

  const getGroup = (id: string) => groups.value.find(group => group.id === id) ?? null
  const getGroupCompanies = (group: SupervisionGroup) => getCompanies(group.cycleId).filter(company => group.companyIds.includes(company.id))
  const getAssignedCompanyIds = (cycleId: string, round: SupervisionRound) => new Set(groups.value
    .filter(group => group.cycleId === cycleId && group.round === round)
    .flatMap(group => group.companyIds))
  const getUnassignedCompanies = (cycleId: string, round: SupervisionRound) => {
    const assignedIds = getAssignedCompanyIds(cycleId, round)
    return getCompanies(cycleId).filter(company => !assignedIds.has(company.id))
  }
  const getAssignedLecturerIds = (cycleId: string, round: SupervisionRound) => new Set(groups.value
    .filter(group => group.cycleId === cycleId && group.round === round)
    .flatMap(group => group.lecturerIds))

  const createGroup = (input: SupervisionGroupInput) => {
    const selectedCompanies = getCompanies(input.cycleId).filter(company => input.companyIds.includes(company.id))
    const assignedCompanyIds = getAssignedCompanyIds(input.cycleId, input.round)
    const assignedLecturerIds = getAssignedLecturerIds(input.cycleId, input.round)
    if (!input.lecturerIds.length) throw new Error('lecturer-required')
    if (!input.companyIds.length) throw new Error('company-required')
    if (input.lecturerIds.some(id => assignedLecturerIds.has(id))) throw new Error('lecturer-already-assigned')
    if (input.companyIds.some(id => assignedCompanyIds.has(id))) throw new Error('company-already-assigned')
    if (selectedCompanies.length !== input.companyIds.length) throw new Error('company-invalid')
    const nextNumber = Math.max(0, ...groups.value.map(group => Number(group.id.replace('SG-', '')) || 0)) + 1
    const group: SupervisionGroup = {
      ...input,
      id: `SG-${String(nextNumber).padStart(3, '0')}`,
      createdAt: new Date().toISOString(),
    }
    groups.value.unshift(group)
    recordEvent(`สร้าง ${group.name} สำหรับการนิเทศครั้งที่ ${group.round}`)
    return group
  }

  return {
    placements,
    groups,
    getGroup,
    getCompanies,
    getGroupCompanies,
    getUnassignedCompanies,
    getAssignedLecturerIds,
    createGroup,
  }
}
