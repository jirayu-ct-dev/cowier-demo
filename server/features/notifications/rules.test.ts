import { describe, expect, it } from 'vitest'
import { createNotificationSchema } from './schema'
import { deduplicateRecipientUserIds } from './rules'

describe('notification contracts', () => {
  it('normalizes duplicate recipients', () => {
    const result = createNotificationSchema.parse({
      type: 'SUPERVISION_APPOINTMENT_PUBLISHED',
      title: 'เผยแพร่ตารางนิเทศแล้ว',
      body: 'นิเทศครั้งที่ 1 วันที่ 2 กันยายน 2569',
      deepLink: '/student/supervision',
      recipientUserIds: ['student-1', 'student-1', 'lecturer-1'],
      appointmentId: 'appointment-1',
    })

    expect(result.recipientUserIds).toEqual(['student-1', 'lecturer-1'])
    expect(result.severity).toBe('info')
  })

  it('rejects links outside the application', () => {
    expect(createNotificationSchema.safeParse({
      type: 'EVALUATION_PENDING',
      title: 'มีงานประเมินค้าง',
      body: 'กรุณาทำแบบประเมินหลังการนิเทศ',
      deepLink: 'https://example.com',
      recipientUserIds: ['lecturer-1'],
    }).success).toBe(false)
    expect(createNotificationSchema.safeParse({
      type: 'EVALUATION_PENDING',
      title: 'มีงานประเมินค้าง',
      body: 'กรุณาทำแบบประเมินหลังการนิเทศ',
      deepLink: '//example.com',
      recipientUserIds: ['lecturer-1'],
    }).success).toBe(false)
  })

  it('removes blank and repeated recipient IDs in the pure rule', () => {
    expect(deduplicateRecipientUserIds([' student-1 ', '', 'student-1', 'lecturer-1'])).toEqual([
      'student-1',
      'lecturer-1',
    ])
  })
})
