import { File } from 'node:buffer'
import { describe, expect, it } from 'vitest'
import { usePeopleImport } from './usePeopleImport'

describe('usePeopleImport', () => {
  it('แยกรายการใหม่ ข้อมูลเดิม และรหัสซ้ำในไฟล์ได้ถูกต้อง', async () => {
    const csv = [
      'รหัสนักศึกษา,คำนำหน้า,ชื่อ,นามสกุล',
      '66123456701,นาย,ธนกฤต,พูนทรัพย์ใหม่',
      '66123456888,นางสาว,ทดสอบ,นำเข้า',
      '66123456889,นาย,ข้อมูล,ซ้ำ',
      '66123456889,นาย,ข้อมูล,ซ้ำอีกครั้ง',
      '66123456890,นาย,ชื่อไม่มี,',
    ].join('\n')
    const file = new File([csv], 'students.csv', { type: 'text/csv' }) as unknown as globalThis.File
    const { parseFile } = usePeopleImport()

    const rows = await parseFile(file, 'student', new Set(['66123456701']))

    expect(rows.map(row => row.status)).toEqual(['update', 'new', 'invalid', 'invalid', 'invalid'])
    expect(rows[2]?.reason).toContain('รหัสซ้ำ')
    expect(rows[4]?.reason).toContain('ไม่พบนามสกุล')
  })
})
