# Webhook และ Signature Verification (LINE Messaging API)

อ่านไฟล์นี้เมื่อต้องเขียน/แก้ webhook endpoint รับ beacon event, ดีบั๊ก signature,
หรือออกแบบการเก็บ/ประมวลผล event

## 1. รูปร่าง request ที่ LINE ส่งมา

```text
POST <webhook URL ที่ตั้งใน console>
Content-Type: application/json
x-line-signature: <base64 HMAC-SHA256 ของ raw body ทั้งหมด>
```

Body (beacon event หนึ่ง event):

```json
{
  "destination": "Uxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  "events": [
    {
      "type": "beacon",
      "replyToken": "nHuyWiB7yP5Z4M3v...",
      "source": { "type": "user", "userId": "Ud34a0658744fe5078c89604c887803ad" },
      "timestamp": 1787497599263,
      "webhookEventId": "01JAZ6F3EXAMPLE00000000000",
      "deliveryContext": { "isRedelivery": false },
      "beacon": { "type": "enter", "hwid": "00000ac5bb", "dm": "" }
    }
  ]
}
```

ฟิลด์ที่ต้องใช้จริง:

| ฟิลด์ | ความหมาย | ข้อควรระวัง |
|---|---|---|
| `webhookEventId` | รหัส event หนึ่งเดียว — idempotency key | event ที่ redeliver ใช้ค่าเดิม; ให้ UNIQUE ใน DB |
| `timestamp` | มิลลิวินาที epoch ที่ LINE ตรวจจับเหตุการณ์ | ใช้เป็น "เวลาเหตุการณ์" ไม่ใช่เวลารับ webhook |
| `source.userId` | lineUserId ของผู้ใช้ (ขึ้นต้น `U`) | เชื่อถือได้เพราะผ่าน signature แล้ว |
| `beacon.hwid` | รหัสอุปกรณ์ hex 10 ตัว | เทียบกับตาราง beacon ของระบบ (case ตามที่ LINE ส่ง) |
| `beacon.type` | `enter` = เข้าพื้นที่; `banner` = กดแบนเนอร์; บางอุปกรณ์มี `stay` | เช็ค type ก่อนประมวลผล — มักใช้เฉพาะ `enter` |
| `replyToken` | ใช้ตอบกลับได้ครั้งเดียว ภายใน ~1 นาที | เก็บไว้ใน raw payload เพื่อใช้ตอนประมวลผล |
| `destination` | bot id ปลายทาง | มักไม่ต้องใช้ |

หมายเหตุ: request เดียวมีได้หลาย event ใน `events[]` (burst ตอนคนเข้าพื้นที่พร้อมกัน)

## 2. Signature verification

หลักการ: `x-line-signature` = `base64(HMAC-SHA256(channelSecret, rawBody))` —
ต้อง verify กับ **raw bytes ที่รับมา** ก่อนแตะอะไรอื่น การ parse JSON แล้ว re-serialize
ก่อน hash จะทำให้ผลเพี้ยน (ลำดับ key/whitespace เปลี่ยน)

Express/NestJS ต้องเปิด raw body สำหรับ route นี้:

```ts
// main.ts (NestJS) — rawBody สำหรับทุก route แล้วอ่าน request.rawBody ใน controller
const app = await NestFactory.create(AppModule, { rawBody: true })
```

```ts
import { validateSignature } from '@line/bot-sdk'

if (!rawBody || !signature || !validateSignature(rawBody, channelSecret, signature)) {
  throw new UnauthorizedException('ลายเซ็น LINE ไม่ถูกต้อง') // → 401, ไม่ persist อะไร
}
```

กรณีไม่มี `channelSecret` ใน config: ตอบ 503 และแจ้ง configuration error ห้ามปล่อยผ่าน
หรือตอบ 2xx เฉย ๆ หากเปิด Webhook redelivery LINE อาจส่งใหม่ แต่ไม่รับประกัน

## 3. รูปแบบ endpoint ที่ถูกต้อง (persist → 2xx → process)

```text
ตรวจ signature ──ไม่ผ่าน──> 401 (จบ, ไม่มีร่องรอย)
      |
    ผ่าน
      v
parse JSON ──พัง──> 400
      |
  สำหรับทุก beacon event:
      persist แถว event ดิบ (RECEIVED, UNIQUE webhook_event_id)
      ├── ชน unique ──> ข้าม (event เคยรับแล้ว)
      └── สำเร็จ ──> ส่งเข้า durable queue หรือให้ recovery worker หยิบไปทำต่อ
      v
ตอบ 2xx ทันที (อย่ารอประมวลผลเสร็จ)
```

event store ควรมีอย่างน้อย: `webhook_event_id` (UNIQUE),
`line_user_id`, `hwid`, `event_type`, `event_timestamp`, `processing_status`,
`raw_payload`, `created_at` (เวลาที่ server ได้รับ — ต่างจาก event_timestamp)

กำหนด `processing_status` ให้ปิดทุก event ด้วยผลลัพธ์ชัดเจน เช่น:
`RECEIVED → PROCESSED | DUPLICATE | UNKNOWN_USER | UNKNOWN_BEACON |
NO_ACTIVE_ACTIVITY | OUTSIDE_CHECKIN_WINDOW | ERROR`

หลังตอบ 2xx ต้องมีทางกู้ event ที่ค้าง `RECEIVED` หาก process หยุดก่อนงาน background
เริ่มทำ เช่น durable job queue หรือ scheduled recovery worker การ persist แล้วเรียก Promise
แบบ fire-and-forget ใน process อย่างเดียวทำ event หายได้เมื่อ process crash

## 4. ตัวอย่างประมวลผล enter event สำหรับระบบเช็คชื่อ

```ts
if (eventType !== 'enter') { markProcessed(); return }        // banner/stay ไม่ใช่ check-in
const account = await findLineAccount(lineUserId)             // map LINE → ผู้ใช้ของเรา
if (!account) { mark('UNKNOWN_USER'); notifyInviteToRegister(); return }
const beacon = await findBeaconByHwid(hwid)
if (!beacon) { mark('UNKNOWN_BEACON'); return }               // ไม่ auto-create
const activities = await eligibleActivities(beacon)           // PUBLISHED + ลิงก์ beacon
if (activities.length === 0) { mark('NO_ACTIVE_ACTIVITY'); notifyWithCooldown(); return }
const hit = activities.filter(a => ts >= a.checkinOpenAt && ts <= a.checkinCloseAt)
if (hit.length === 0) { mark('OUTSIDE_CHECKIN_WINDOW'); notifyWithCooldown(); return }
if (hit.length > 1) { mark('ERROR'); return }                 // กิจกรรมซ้อนหน้าต่าง = ปฏิเสธเสมอ
// สร้างผลลัพธ์ธุรกิจแบบกันซ้ำ (UNIQUE constraint เป็นด่านสุดท้าย)
```

จุดสำคัญสามข้อ:
- **ตัดสินเวลาด้วย `event_timestamp`** เท่านั้น (เกณฑ์ PRESENT/LATE, ใน/นอกหน้าต่าง)
- **กันซ้ำสองชั้น**: เช็ค existing ก่อน create แล้วให้ `UNIQUE(activity_id, student_id)`
  เป็นด่านสุดท้าย — แพ้ race (P2002) = ถือเป็น duplicate ไม่ใช่ error
- **duplicate ของผลลัพธ์ ≠ เงียบ**: แจ้งผู้ใช้ด้วยข้อความคนละแบบจาก success
  ("คุณเช็คชื่อไปแล้ว") ภายใต้ cooldown ของ type นั้น

ตัวอย่างนี้อธิบาย invariants ของระบบเช็คชื่อ ไม่ใช่ schema หรือชื่อ service ที่ทุกโปรเจกต์
ต้องใช้ ให้ปรับกับ domain และ constraint จริงของโปรเจกต์เป้าหมาย

## 5. การส่งข้อความหลังประมวลผล

- ใช้ `replyToken` จาก raw payload ของ event ตัวนั้นก่อน (ฟรี) — token หมดอายุ ~1 นาที
  จึงต้องประมวลผลเร็ว; reply ล้ม → push fallback (`to: lineUserId`)
- บันทึกผลทุกครั้งใน notification store (เช่น PENDING → SENT/FAILED + error message)
  และ **ห้ามเก็บ token/secret ใน log**
- Cooldown: ก่อนส่ง type ใด ให้เช็ค `findFirst({ status: 'SENT', type, ผู้ใช้,
  กิจกรรม, sentAt >= now - N นาที })` — มีแล้ว = SKIPPED ไม่ต้องส่ง/ไม่บันทึกซ้ำ
- การส่งล้มเหลวทั้งหมดต้องไม่ทำให้: ผลลัพธ์ธุรกิจที่สร้างแล้ว rollback, หรือ HTTP response
  กลายเป็น non-200

## 6. การทดสอบ (ไม่ต้องมีอุปกรณ์/บัญชีจริง)

1. จำลอง request ที่ลงนามถูกต้อง (สูตร node + openssl ใน SKILL.md §7)
2. Test หลักที่ควรมีในชุด test ของ webhook engine:
   - signature ผิด/หาย → 401 และไม่มีแถว event
   - event ใหม่ → สร้างผลลัพธ์ + ส่ง reply หนึ่งครั้ง
   - `webhookEventId` ซ้ำ → ข้าม ไม่ประมวลผลซ้ำ
   - enter ครั้งที่สอง (id ต่างกัน) → ไม่สร้างผลลัพธ์ซ้ำ + ข้อความ "เช็คแล้ว" + cooldown
   - นอกหน้าต่างเวลา / ไม่มีกิจกรรม / ผู้ใช้ไม่ได้ลิงก์ → status + ข้อความตามตาราง §3
   - reply ล้ม → push ถูกเรียก, แถว notifications เป็นตามผลจริง
3. Integration test ควรใช้ฐานข้อมูลหรือ event store จริงของ test environment, mock LINE
   client ที่ boundary และรอ worker/queue จบด้วยกลไกของโปรเจกต์ก่อน assert
4. จำลอง process restart หลัง persist แต่ก่อน process แล้วตรวจว่า recovery path ทำ event
   ต่อจนจบโดยไม่สร้างผลลัพธ์ซ้ำ
