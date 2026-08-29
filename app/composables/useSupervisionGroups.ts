export type SupervisionRound = 1 | 2
export type SupervisionScopeType = 'region' | 'province' | 'company'

export interface SupervisionPlacement {
  id: string
  cycleId: string
  studentId: string
  studentName: string
  company: string
  branch: string
  province: string
  region: string
  position: string
}

export interface SupervisionGroup {
  id: string
  cycleId: string
  round: SupervisionRound
  name: string
  scopeType: SupervisionScopeType
  scopeValues: string[]
  lecturerIds: string[]
  placementIds: string[]
  createdAt: string
}

export interface SupervisionGroupInput {
  cycleId: string
  round: SupervisionRound
  name: string
  scopeType: SupervisionScopeType
  scopeValues: string[]
  lecturerIds: string[]
  placementIds: string[]
}

const placementsSeed: SupervisionPlacement[] = [
  { id: 'SP-001', cycleId: 'CYCLE-2569-2', studentId: '66123456701', studentName: 'ธนกฤต พูนทรัพย์', company: 'บริษัท สยามเทค โซลูชัน จำกัด', branch: 'สำนักงานใหญ่', province: 'บุรีรัมย์', region: 'ภาคตะวันออกเฉียงเหนือ', position: 'Frontend Developer' },
  { id: 'SP-002', cycleId: 'CYCLE-2569-2', studentId: '66123456702', studentName: 'ณัฐชา ศรีสุข', company: 'บริษัท อีสานดิจิทัล จำกัด', branch: 'สำนักงานใหญ่', province: 'บุรีรัมย์', region: 'ภาคตะวันออกเฉียงเหนือ', position: 'Software Tester' },
  { id: 'SP-003', cycleId: 'CYCLE-2569-2', studentId: '66123456704', studentName: 'ภัทรวดี คำแสน', company: 'บริษัท บุรีรัมย์เว็บ จำกัด', branch: 'สำนักงานใหญ่', province: 'บุรีรัมย์', region: 'ภาคตะวันออกเฉียงเหนือ', position: 'Web Developer' },
  { id: 'SP-004', cycleId: 'CYCLE-2569-2', studentId: '66123456708', studentName: 'ชยพล พรมดี', company: 'บริษัท โคราชซอฟต์ จำกัด', branch: 'สำนักงานใหญ่', province: 'นครราชสีมา', region: 'ภาคตะวันออกเฉียงเหนือ', position: 'Backend Developer' },
  { id: 'SP-005', cycleId: 'CYCLE-2569-2', studentId: '66123456711', studentName: 'ปวีณ์นุช มั่นคง', company: 'บริษัท อีสานเทค จำกัด', branch: 'สาขาขอนแก่น', province: 'ขอนแก่น', region: 'ภาคตะวันออกเฉียงเหนือ', position: 'UX/UI Designer' },
  { id: 'SP-006', cycleId: 'CYCLE-2569-2', studentId: '66123456715', studentName: 'นภัสสร มีสุข', company: 'บริษัท นอร์ทเทิร์นดิจิทัล จำกัด', branch: 'สาขาเชียงใหม่', province: 'เชียงใหม่', region: 'ภาคเหนือ', position: 'Data Analyst' },
  { id: 'SP-007', cycleId: 'CYCLE-2569-2', studentId: '66123456720', studentName: 'ศุภกร รุ่งเรือง', company: 'บริษัท บางกอกคลาวด์ จำกัด', branch: 'สำนักงานใหญ่', province: 'กรุงเทพมหานคร', region: 'ภาคกลาง', position: 'Cloud Engineer' },
  { id: 'SP-008', cycleId: 'CYCLE-2569-SUMMER', studentId: '66123456725', studentName: 'อรอนงค์ สายใจ', company: 'บริษัท ภูเก็ตสมาร์ท จำกัด', branch: 'สำนักงานใหญ่', province: 'ภูเก็ต', region: 'ภาคใต้', position: 'Software Developer' },
]

const groupsSeed: SupervisionGroup[] = [
  { id: 'SG-001', cycleId: 'CYCLE-2569-2', round: 1, name: 'กลุ่มบุรีรัมย์ 1', scopeType: 'province', scopeValues: ['บุรีรัมย์'], lecturerIds: ['L0012'], placementIds: ['SP-001', 'SP-002'], createdAt: '2026-08-29T10:00:00+07:00' },
  { id: 'SG-002', cycleId: 'CYCLE-2569-2', round: 2, name: 'กลุ่มภาคอีสานตอนล่าง', scopeType: 'region', scopeValues: ['ภาคตะวันออกเฉียงเหนือ'], lecturerIds: ['L0021'], placementIds: ['SP-001', 'SP-004'], createdAt: '2026-08-30T09:30:00+07:00' },
]

export const supervisionScopeMeta: Record<SupervisionScopeType, { label: string }> = {
  region: { label: 'ภูมิภาค' },
  province: { label: 'จังหวัด' },
  company: { label: 'สถานประกอบการ' },
}

export const useSupervisionGroups = () => {
  const placements = useState<SupervisionPlacement[]>('supervision-placements', () => structuredClone(placementsSeed))
  const groups = useState<SupervisionGroup[]>('supervision-groups', () => structuredClone(groupsSeed))
  const { recordEvent } = useScenario()

  const getGroup = (id: string) => groups.value.find(group => group.id === id) ?? null
  const getGroupPlacements = (group: SupervisionGroup) => placements.value.filter(placement => group.placementIds.includes(placement.id))
  const getAssignedPlacementIds = (cycleId: string, round: SupervisionRound) => new Set(groups.value
    .filter(group => group.cycleId === cycleId && group.round === round)
    .flatMap(group => group.placementIds))
  const getUnassignedPlacements = (cycleId: string, round: SupervisionRound) => {
    const assignedIds = getAssignedPlacementIds(cycleId, round)
    return placements.value.filter(placement => placement.cycleId === cycleId && !assignedIds.has(placement.id))
  }

  const createGroup = (input: SupervisionGroupInput) => {
    const assignedIds = getAssignedPlacementIds(input.cycleId, input.round)
    const selectedPlacements = placements.value.filter(placement => input.placementIds.includes(placement.id))
    if (input.placementIds.some(id => assignedIds.has(id))) throw new Error('placement-already-assigned')
    if (selectedPlacements.length !== input.placementIds.length || selectedPlacements.some(placement => placement.cycleId !== input.cycleId)) throw new Error('placement-invalid')
    if (!input.lecturerIds.length) throw new Error('lecturer-required')
    if (!input.placementIds.length) throw new Error('placement-required')
    const nextNumber = Math.max(0, ...groups.value.map(group => Number(group.id.replace('SG-', '')) || 0)) + 1
    const group: SupervisionGroup = {
      ...input,
      id: `SG-${String(nextNumber).padStart(3, '0')}`,
      createdAt: new Date().toISOString(),
    }
    groups.value.unshift(group)
    recordEvent(`สร้างกลุ่มนิเทศ ${group.name} ครั้งที่ ${group.round}`)
    return group
  }

  return { placements, groups, getGroup, getGroupPlacements, getUnassignedPlacements, createGroup }
}
