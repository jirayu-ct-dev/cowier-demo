import { PrismaClient, RegionCode } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

const provinces: Array<{ code: string, nameTh: string, region: RegionCode }> = [
  { code: '10', nameTh: 'กรุงเทพมหานคร', region: RegionCode.CENTRAL },
  { code: '11', nameTh: 'สมุทรปราการ', region: RegionCode.CENTRAL },
  { code: '12', nameTh: 'นนทบุรี', region: RegionCode.CENTRAL },
  { code: '13', nameTh: 'ปทุมธานี', region: RegionCode.CENTRAL },
  { code: '14', nameTh: 'พระนครศรีอยุธยา', region: RegionCode.CENTRAL },
  { code: '15', nameTh: 'อ่างทอง', region: RegionCode.CENTRAL },
  { code: '16', nameTh: 'ลพบุรี', region: RegionCode.CENTRAL },
  { code: '17', nameTh: 'สิงห์บุรี', region: RegionCode.CENTRAL },
  { code: '18', nameTh: 'ชัยนาท', region: RegionCode.CENTRAL },
  { code: '19', nameTh: 'สระบุรี', region: RegionCode.CENTRAL },
  { code: '20', nameTh: 'ชลบุรี', region: RegionCode.EAST },
  { code: '21', nameTh: 'ระยอง', region: RegionCode.EAST },
  { code: '22', nameTh: 'จันทบุรี', region: RegionCode.EAST },
  { code: '23', nameTh: 'ตราด', region: RegionCode.EAST },
  { code: '24', nameTh: 'ฉะเชิงเทรา', region: RegionCode.EAST },
  { code: '25', nameTh: 'ปราจีนบุรี', region: RegionCode.EAST },
  { code: '26', nameTh: 'นครนายก', region: RegionCode.CENTRAL },
  { code: '27', nameTh: 'สระแก้ว', region: RegionCode.EAST },
  { code: '30', nameTh: 'นครราชสีมา', region: RegionCode.NORTHEAST },
  { code: '31', nameTh: 'บุรีรัมย์', region: RegionCode.NORTHEAST },
  { code: '32', nameTh: 'สุรินทร์', region: RegionCode.NORTHEAST },
  { code: '33', nameTh: 'ศรีสะเกษ', region: RegionCode.NORTHEAST },
  { code: '34', nameTh: 'อุบลราชธานี', region: RegionCode.NORTHEAST },
  { code: '35', nameTh: 'ยโสธร', region: RegionCode.NORTHEAST },
  { code: '36', nameTh: 'ชัยภูมิ', region: RegionCode.NORTHEAST },
  { code: '37', nameTh: 'อำนาจเจริญ', region: RegionCode.NORTHEAST },
  { code: '38', nameTh: 'บึงกาฬ', region: RegionCode.NORTHEAST },
  { code: '39', nameTh: 'หนองบัวลำภู', region: RegionCode.NORTHEAST },
  { code: '40', nameTh: 'ขอนแก่น', region: RegionCode.NORTHEAST },
  { code: '41', nameTh: 'อุดรธานี', region: RegionCode.NORTHEAST },
  { code: '42', nameTh: 'เลย', region: RegionCode.NORTHEAST },
  { code: '43', nameTh: 'หนองคาย', region: RegionCode.NORTHEAST },
  { code: '44', nameTh: 'มหาสารคาม', region: RegionCode.NORTHEAST },
  { code: '45', nameTh: 'ร้อยเอ็ด', region: RegionCode.NORTHEAST },
  { code: '46', nameTh: 'กาฬสินธุ์', region: RegionCode.NORTHEAST },
  { code: '47', nameTh: 'สกลนคร', region: RegionCode.NORTHEAST },
  { code: '48', nameTh: 'นครพนม', region: RegionCode.NORTHEAST },
  { code: '49', nameTh: 'มุกดาหาร', region: RegionCode.NORTHEAST },
  { code: '50', nameTh: 'เชียงใหม่', region: RegionCode.NORTH },
  { code: '51', nameTh: 'ลำพูน', region: RegionCode.NORTH },
  { code: '52', nameTh: 'ลำปาง', region: RegionCode.NORTH },
  { code: '53', nameTh: 'อุตรดิตถ์', region: RegionCode.NORTH },
  { code: '54', nameTh: 'แพร่', region: RegionCode.NORTH },
  { code: '55', nameTh: 'น่าน', region: RegionCode.NORTH },
  { code: '56', nameTh: 'พะเยา', region: RegionCode.NORTH },
  { code: '57', nameTh: 'เชียงราย', region: RegionCode.NORTH },
  { code: '58', nameTh: 'แม่ฮ่องสอน', region: RegionCode.NORTH },
  { code: '60', nameTh: 'นครสวรรค์', region: RegionCode.NORTH },
  { code: '61', nameTh: 'อุทัยธานี', region: RegionCode.NORTH },
  { code: '62', nameTh: 'กำแพงเพชร', region: RegionCode.NORTH },
  { code: '63', nameTh: 'ตาก', region: RegionCode.WEST },
  { code: '64', nameTh: 'สุโขทัย', region: RegionCode.NORTH },
  { code: '65', nameTh: 'พิษณุโลก', region: RegionCode.NORTH },
  { code: '66', nameTh: 'พิจิตร', region: RegionCode.NORTH },
  { code: '67', nameTh: 'เพชรบูรณ์', region: RegionCode.NORTH },
  { code: '70', nameTh: 'ราชบุรี', region: RegionCode.WEST },
  { code: '71', nameTh: 'กาญจนบุรี', region: RegionCode.WEST },
  { code: '72', nameTh: 'สุพรรณบุรี', region: RegionCode.CENTRAL },
  { code: '73', nameTh: 'นครปฐม', region: RegionCode.CENTRAL },
  { code: '74', nameTh: 'สมุทรสาคร', region: RegionCode.CENTRAL },
  { code: '75', nameTh: 'สมุทรสงคราม', region: RegionCode.CENTRAL },
  { code: '76', nameTh: 'เพชรบุรี', region: RegionCode.WEST },
  { code: '77', nameTh: 'ประจวบคีรีขันธ์', region: RegionCode.WEST },
  { code: '80', nameTh: 'นครศรีธรรมราช', region: RegionCode.SOUTH },
  { code: '81', nameTh: 'กระบี่', region: RegionCode.SOUTH },
  { code: '82', nameTh: 'พังงา', region: RegionCode.SOUTH },
  { code: '83', nameTh: 'ภูเก็ต', region: RegionCode.SOUTH },
  { code: '84', nameTh: 'สุราษฎร์ธานี', region: RegionCode.SOUTH },
  { code: '85', nameTh: 'ระนอง', region: RegionCode.SOUTH },
  { code: '86', nameTh: 'ชุมพร', region: RegionCode.SOUTH },
  { code: '90', nameTh: 'สงขลา', region: RegionCode.SOUTH },
  { code: '91', nameTh: 'สตูล', region: RegionCode.SOUTH },
  { code: '92', nameTh: 'ตรัง', region: RegionCode.SOUTH },
  { code: '93', nameTh: 'พัทลุง', region: RegionCode.SOUTH },
  { code: '94', nameTh: 'ปัตตานี', region: RegionCode.SOUTH },
  { code: '95', nameTh: 'ยะลา', region: RegionCode.SOUTH },
  { code: '96', nameTh: 'นราธิวาส', region: RegionCode.SOUTH },
]

const seed = async () => {
  const initialPassword = process.env.SEED_STAFF_PASSWORD
  if (!initialPassword || initialPassword.length < 12) {
    throw new Error('SEED_STAFF_PASSWORD must contain at least 12 characters')
  }

  await prisma.$transaction(
    provinces.map(province => prisma.province.upsert({
      where: { code: province.code },
      update: { nameTh: province.nameTh, region: province.region },
      create: province,
    })),
  )

  const passwordHash = await hash(initialPassword, 12)
  const staff = await prisma.user.upsert({
    where: { username: 'staff001' },
    update: {
      role: 'STAFF',
      recordStatus: 'ACTIVE',
      namePrefix: 'นางสาว',
      firstName: 'พิมพ์ชนก',
      lastName: 'ใจดี',
    },
    create: {
      id: 'seed-staff-001',
      username: 'staff001',
      passwordHash,
      role: 'STAFF',
      status: 'FIRST_LOGIN',
      namePrefix: 'นางสาว',
      firstName: 'พิมพ์ชนก',
      lastName: 'ใจดี',
    },
  })

  const cycle = await prisma.coopCycle.upsert({
    where: { code: 'CYCLE-2569-2' },
    update: {
      label: 'ภาคเรียนที่ 2/2569',
      termLabel: 'ภาคเรียนที่ 2',
      requestStartDate: new Date('2026-06-01T00:00:00.000Z'),
      requestEndDate: new Date('2026-08-31T00:00:00.000Z'),
      trainingStartDate: new Date('2026-11-02T00:00:00.000Z'),
      trainingEndDate: new Date('2027-02-26T00:00:00.000Z'),
    },
    create: {
      id: 'seed-cycle-2569-2',
      code: 'CYCLE-2569-2',
      label: 'ภาคเรียนที่ 2/2569',
      academicYear: 2569,
      term: 'SECOND',
      termLabel: 'ภาคเรียนที่ 2',
      targetCohortYear: 2566,
      requestStartDate: new Date('2026-06-01T00:00:00.000Z'),
      requestEndDate: new Date('2026-08-31T00:00:00.000Z'),
      trainingStartDate: new Date('2026-11-02T00:00:00.000Z'),
      trainingEndDate: new Date('2027-02-26T00:00:00.000Z'),
      status: 'DRAFT',
    },
  })

  const existingHistory = await prisma.coopCycleStatusHistory.findFirst({
    where: { cycleId: cycle.id, fromStatus: null, toStatus: 'DRAFT' },
    select: { id: true },
  })
  if (!existingHistory) {
    await prisma.coopCycleStatusHistory.create({
      data: {
        cycleId: cycle.id,
        toStatus: 'DRAFT',
        reason: 'สร้างข้อมูลรอบเริ่มต้นจากระบบ seed',
        changedById: staff.id,
      },
    })
  }
}

seed()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error)
    await prisma.$disconnect()
    process.exit(1)
  })
