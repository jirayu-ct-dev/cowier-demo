# แผนพัฒนา Backend สำหรับผู้พัฒนาคนเดียว

> **สถานะเอกสาร:** แผนหลักฉบับใหม่ ณ วันที่ 2 กันยายน 2569  
> รวบรวมและตรวจทานงานจากแผนเดิมที่แบ่งผู้พัฒนา 2 คนไว้ครบแล้ว

## 1. เป้าหมาย

พัฒนาระบบจาก UI Prototype ที่ใช้ mock data ให้เป็นระบบใช้งานภายในสาขาที่มี Backend,
MySQL, Authentication และ Docker ครบ โดยทำงานเป็น **vertical slice** ทีละ Feature:

```text
UI contract → API route → Zod validation → service/rules
→ Prisma repository → MySQL → audit/notification → tests → เชื่อม UI
```

ไม่ทำ repository ของทุกตารางให้เสร็จก่อน API และไม่สร้าง abstraction เผื่ออนาคต
แต่ละ checkpoint ต้องสามารถทดสอบและส่งมอบได้ด้วยตัวเองก่อนเริ่มงานที่พึ่งพากัน

## 2. สถานะจริงของโครงการ

### ทำแล้ว

- [x] UI Prototype และ route หลักของ Staff, Lecturer และ Student
- [x] Requirement ฉบับอ้างอิงจาก Prototype ที่ `dosc/requirement.md`
- [x] Prisma schema สำหรับ MySQL จำนวน 25 models
- [x] Docker Compose สำหรับ Nuxt และ MySQL 8.4 พร้อม database healthcheck
- [x] Zod contract/rules ระยะแรกของ Company, Cycle, Supervision, Evaluation และ Notification
- [x] Company repository/service ระยะแรก รวม delete guard และ unit tests
- [x] Prisma schema ผ่าน validate/generate และเคย push เข้า development database แล้ว
- [x] Initial migration, Prisma 7 MySQL adapter และ Prisma singleton
- [x] Seed จังหวัด 77 จังหวัด รอบตัวอย่าง และบัญชี Staff จาก environment
- [x] Shared API response/error, request validation และ Audit service
- [x] Integration test bootstrap ที่แยกจาก development database
- [x] Docker one-shot migration และ app/database healthcheck

### ยังไม่ทำหรือยังใช้งานจริงไม่ได้

- [x] Authentication, encrypted server session และ RBAC
- [ ] API จริงของ Feature ถัดจาก Auth; ปัจจุบันมี Auth, health และ mock document endpoint
- [ ] File storage สำหรับ PDF
- [ ] เปลี่ยน composable จาก mock state เป็น API
- [ ] End-to-end tests, backup/restore และ production runbook

## 3. ข้อสรุปขอบเขตก่อนเริ่ม

ให้ใช้ข้อตกลงต่อไปนี้เป็น baseline เพื่อลดงานที่ไม่จำเป็น:

1. ใช้ `User` ตารางเดียวสำหรับ Staff, Lecturer และ Student ตาม `role`; ไม่แยก profile table
2. ไม่สร้าง session table; ใช้ encrypted server session และ `sessionVersion` ใน `User`
3. เก็บ `AuditLog` สำหรับ mutation สำคัญ แต่ไม่ทำ session audit ทุก request
4. แบบประเมินใช้ **7 หัวข้อนักศึกษาและ 7 หัวข้อสถานประกอบการ** ตาม Requirement,
   UI และ Prisma schema; ข้อความ 10/8 ในแผนเดิมถือว่าเลิกใช้
5. ใช้ `User.username` เป็นรหัสนักศึกษา/รหัสอาจารย์และชื่อเข้าระบบเดียวกัน
   จึงต้อง unique ทั้งระบบ; ไม่เพิ่ม code ซ้ำอีก column โดยไม่มี use case
6. Staff/Lecturer สร้างบริษัทเป็น `ACTIVE`; Student สร้างบริษัทใหม่เป็น `PENDING`
7. บริษัท `PENDING` ค้นหาและนำไปใช้ในคำร้องได้ แต่การ merge บริษัทซ้ำยังไม่อยู่ใน MVP
8. ใช้ `inactive` แทน hard delete เมื่อข้อมูลมีประวัติอ้างอิง
9. Appointment รุ่นแรกทำเฉพาะ read, ownership, บันทึกตารางพร้อม completion และผลนิเทศ
   ตาม action ที่ Prototype มีจริง; create/publish/postpone/cancel แยกเป็น optional scope
10. PDF เก็บใน storage volume/adapter และเก็บเฉพาะ metadata ใน MySQL
11. ไม่มีงบประมาณ/เบิกจ่าย, reporting warehouse, background jobs และ custom rubric ใน MVP

ก่อนทำ Letter/PDF ต้องยืนยันเพิ่มเพียงเรื่องเดียว: ผู้ใดเป็นผู้อัปโหลดหนังสือตอบกลับในระบบจริง
เพราะ Prototype ปัจจุบันมีเพียงข้อมูลจำลองและยังไม่มี upload action ที่ชัดเจน

## 4. ลำดับ Checkpoint

### Checkpoint 0 — Freeze contract และทำเอกสารให้ตรงกัน

เป้าหมาย: มี source of truth เดียวก่อนสร้าง migration ซึ่งแก้ย้อนหลังได้ยาก

- [ ] ยืนยัน Placement Request state transition จาก enum ปัจจุบัน
- [ ] ยืนยันผู้ upload หนังสือตอบกลับและสิทธิ์ดาวน์โหลด
- [ ] ยืนยันว่า Appointment optional actions ใดจะอยู่ใน MVP
- [ ] ยืนยันการใช้ `User.username` เป็นรหัสบุคคลและชื่อเข้าระบบแบบ unique ทั้งระบบ
- [ ] แก้ `architecture.md`, `database-design.md` และ `README.md` ที่ยังระบุว่า Backend ไม่เริ่ม
- [ ] ลบข้อความเรื่อง budget และ dependency รุ่นเก่าที่ไม่ตรง Requirement/`package.json`
- [ ] Freeze `prisma/schema.prisma` สำหรับ initial migration

ผ่านเมื่อ: Requirement, schema และ UI ใช้ชื่อสถานะ/จำนวนหัวข้อ/ownership ตรงกัน

### Checkpoint 1 — Backend และ Database Foundation

เป้าหมาย: เปิดฐานข้อมูลว่างแล้วระบบ migrate, seed, connect และ test ได้เหมือนกันทั้ง local/Docker

- [x] ติดตั้ง MySQL driver adapter ที่ตรงกับ Prisma 7
- [x] สร้าง `server/core/database/prisma.ts` เป็น Prisma singleton
- [x] แก้ Prisma config ให้ migrate ใช้ `DATABASE_URL` ได้โดยไม่ต้องส่ง `--url` ด้วยมือ
- [x] สร้าง initial migration จาก schema ที่ freeze แล้ว
- [x] สร้าง seed จังหวัด 77 จังหวัด รอบ development และบัญชี Staff เริ่มต้น
- [x] Seed ต้องรันซ้ำได้โดยไม่สร้างข้อมูลซ้ำ
- [x] ห้ามใส่ production password จริงใน repository; รับ secret จาก environment
- [x] เพิ่ม scripts: `db:generate`, `db:migrate`, `db:migrate:deploy`, `db:seed`, `db:reset`
- [x] สร้าง API response/error และ Zod request helper กลาง
- [x] สร้าง Audit repository/service กลาง
- [x] สร้าง test database bootstrap แยกจาก development database
- [x] เพิ่ม `/api/health` ที่ตรวจ readiness ของ app และ database
- [x] เพิ่ม one-shot migration service ใน Compose ก่อน app start

สถานะ: **เสร็จแล้วเมื่อ 2 กันยายน 2569** — ทดสอบจากฐานข้อมูล Docker volume ใหม่,
seed ซ้ำ 2 รอบโดยจำนวนข้อมูลคงที่ และ app/database healthcheck ผ่าน

Tests ขั้นต่ำ:

- migrate + seed จากฐานข้อมูลว่าง
- Prisma query จริงผ่าน adapter
- error ไม่ส่ง stack trace หรือข้อมูลลับ
- Docker start ตามลำดับ MySQL → migration → app healthy

### Checkpoint 2 — Authentication, Session และ RBAC

เป้าหมาย: เลิกใช้ `useAuthPrototype` เป็นกลไกสิทธิ์ และป้องกัน API ทุก route จาก server

- [x] Login, logout และ current session
- [x] First-login password change และเปลี่ยนรหัสผ่านด้วยรหัสเดิม
- [x] Account status: first-login, active, suspended, terminated
- [x] Brute-force lock ตาม `failedLoginCount`, `failedWindowAt`, `lockedUntil`
- [x] ใช้ `sessionVersion` ยกเลิก session เดิมหลัง reset/suspend/terminate
- [x] `requireUser`, `requireRole` และ `requirePlacementReviewer`
- [x] Reset password โดย Staff
- [x] Audit login success/failure, logout, password change/reset และ account state mutation
- [x] เปลี่ยน client middleware ให้ตรวจ session จริง

สถานะ: **เสร็จแล้วเมื่อ 2 กันยายน 2569** — ใช้ encrypted cookie session อายุ 8 ชั่วโมง,
ตรวจบัญชีและ `sessionVersion` จาก MySQL ที่ server ทุก request, ป้องกัน API ด้วย global
middleware และยืนยัน flow จริงบน Docker ครบ 401/403, first-login และ session revocation

Tests ขั้นต่ำ:

- login สำเร็จ/รหัสผิด/locked/suspended/terminated
- first-login เข้า feature อื่นไม่ได้ก่อนเปลี่ยนรหัสผ่าน
- route ของแต่ละ role ได้ 401/403 ถูกต้อง
- session เก่าใช้ไม่ได้หลังเพิ่ม `sessionVersion`

### Checkpoint 3 — People Master Data และ Import/Export

เป้าหมาย: Staff จัดการบัญชี/ข้อมูล Student และ Lecturer ได้ครบแบบ end-to-end

- [ ] CRUD, search, filter และ pagination จากตาราง `User`
- [ ] Lecturer แก้ได้เฉพาะชื่อ/นามสกุลนักศึกษาตาม Requirement
- [ ] ใช้ `username` เป็นรหัสบุคคลและตรวจซ้ำทั้งระบบก่อน create/import/update
- [ ] ยุติการใช้งานด้วย status/recordStatus ไม่ลบประวัติ
- [ ] Import CSV/XLSX แบบ preview → validate → commit ใน transaction
- [ ] ตรวจชนิดไฟล์และขนาดไม่เกิน 5 MB
- [ ] Error รายแถวโดยไม่บันทึกข้อมูลบางส่วน
- [ ] Export ข้อมูลทั้งหมดของประเภทที่เลือกตาม Requirement โดยใช้ library ที่ติดตั้งอยู่จริง
- [ ] เชื่อมหน้า `/staff/master-data/**` และหน้า Lecturer student directory

ผ่านเมื่อ: สร้างผู้ใช้ → login → filter/export → suspend/restore ได้ด้วยข้อมูลจริง

### Checkpoint 4 — Company Master Data

เป้าหมาย: ปิดงานที่เริ่มไว้แล้วและนำ Company service ไปใช้จริง

- [x] Zod schema, repository, service และ unit tests ระยะแรก
- [x] Search/filter/pagination และ hard-delete reference guard ใน data layer
- [ ] API จังหวัดสำหรับ search/select
- [ ] Company/Site CRUD และ status routes
- [ ] RBAC: ทุก role อ่านได้; Staff/Lecturer จัดการ; Student เพิ่มแบบ `PENDING`
- [ ] แยก Student create schema ให้รับเพียงชื่อ ที่อยู่ จังหวัด; contact เป็น nullable ตามฐานข้อมูล
- [ ] ภูมิภาคอ่านจาก `Province.region` เท่านั้น ไม่รับค่าภูมิภาคอิสระจาก request
- [ ] Audit create/update/status/delete
- [ ] Integration test delete guard กับ reference จริงใน MySQL
- [ ] Map Prisma enum เป็น API/UI contract ตัวพิมพ์เล็กให้สม่ำเสมอ
- [ ] เชื่อมหน้า `/companies/**` และ company picker ของ Placement

ผ่านเมื่อ: ข้อมูลที่สร้างจาก UI อยู่หลัง restart และ record ที่ถูกอ้างอิงลบจริงไม่ได้

### Checkpoint 5 — Co-op Cycle และ Enrollment

เป้าหมาย: มี cycle context จริงซึ่ง Placement และ Supervision ใช้ร่วมกัน

- [x] Zod schema ระยะแรก
- [ ] Cycle CRUD และ status history
- [ ] บังคับ transition: draft → open → closed-to-requests → training → closed
- [ ] Current cycle ตาม role/user context
- [ ] เพิ่มนักศึกษาเข้ารอบและแก้ work status
- [ ] ย้ายรอบด้วย transaction: ปิด enrollment เดิม → สร้างใหม่ → audit
- [ ] ตรวจ role ของ student และ active-enrollment uniqueness ใน service
- [ ] เชื่อม Cycle selector และหน้า student detail

ผ่านเมื่อ: นักศึกษามี active enrollment ได้หนึ่งรายการและทุก feature อ่าน cycle เดียวกัน

### Checkpoint 6 — Student Application Tracker

เป้าหมาย: ส่งมอบ Feature CRUD ขนาดเล็กเพื่อพิสูจน์ ownership pattern ก่อน Placement workflow

- [ ] Student CRUD/เปลี่ยนสถานะรายการของตนเอง
- [ ] รองรับหลายรายการต่อ enrollment โดยไม่กำหนดเพดานที่ Requirement ไม่มี
- [ ] Staff/Lecturer อ่านและกรองแบบ read-only
- [ ] ตรวจ ownership ทุก mutation
- [ ] เชื่อมหน้า `/student/applications`

ผ่านเมื่อ: นักศึกษาคนหนึ่งอ่านหรือแก้รายการของอีกคนไม่ได้

### Checkpoint 7 — Placement Request State Machine

เป้าหมาย: ทำ flow หลักตั้งแต่นักศึกษาร่างคำร้องถึงพร้อมรวมหนังสือ

- [ ] Draft/create/update/submit/return/cancel ตาม transition ที่ freeze
- [ ] Active request หนึ่งรายการต่อนักศึกษาหนึ่งคนทั้งระบบ แม้อยู่คนละ cycle
- [ ] ตรวจ cycle เปิดรับคำร้องก่อนสร้างคำร้องใหม่
- [ ] Ownership ของ Student และ permission `canReviewPlacements` ของ Lecturer
- [ ] Status history ทุก transition ใน transaction เดียวกัน
- [ ] Optimistic/concurrent update ด้วย expected status
- [ ] Notification service ขั้นต่ำและเรียกจาก transition สำคัญ
- [ ] Timeline และ list/filter สำหรับ Student/Lecturer/Staff
- [ ] เชื่อมหน้า Placement list/new/detail และ Lecturer review

ผ่านเมื่อ: Draft → Submitted → Returned → Resubmitted ทำครบและ history ไม่ขาด

### Checkpoint 8 — Letter Batch, PDF และ Confirmed Placement

เป้าหมาย: ทำ flow คำร้องทางการจนได้ confirmed placement ซึ่ง Supervision อ่านต่อได้

- [ ] รวมคำร้องที่ cycle/site/recipient/address ตรงกัน
- [ ] สร้าง batch + members + snapshots + request history ใน transaction
- [ ] สร้าง/บันทึกเลขที่หนังสือ และล็อก members/snapshots เมื่อ publish
- [ ] File storage adapter พร้อม local Docker volume
- [ ] ตรวจ PDF extension, declared/detected MIME, magic bytes, size และ SHA-256
- [ ] Document version, supersede/return/review/publish
- [ ] Authenticated download และป้องกัน path traversal
- [ ] บันทึกผลรายบุคคล: confirmed/not accepted
- [ ] ยืนยันแล้วตั้ง confirmed key และ work status เริ่มต้นอย่าง atomic
- [ ] เปิด Confirmed Placement read contract ให้ Supervision
- [ ] Notification สำหรับ publish/return/confirm/reject

ผ่านเมื่อ: ส่งคำร้อง → รวมชุด → แนบ PDF → ยืนยันรายบุคคล → อ่าน confirmed placement ได้

### Checkpoint 9 — Supervision Group และ Schedule Read Model

เป้าหมาย: จัดกลุ่มจาก confirmed placement และแสดงตารางตาม ownership

- [x] Zod contract และ pure rules ระยะแรก
- [ ] Group CRUD พร้อมแทนที่ lecturer/company membership ใน transaction
- [ ] ตรวจ Lecturer active และไม่ซ้ำใน cycle/round
- [ ] ตรวจ CompanySite ไม่ซ้ำใน cycle/round
- [ ] อนุมานนักศึกษาจาก confirmed placements; ไม่เลือกนักศึกษาเข้ากลุ่มตรง ๆ
- [ ] Appointment read model สำหรับ Staff/Lecturer/Student
- [ ] Lecturer ผู้รับผิดชอบเพิ่ม/ถอน planned participants ของรายการที่ตนดูแลได้
- [ ] Student เห็นเฉพาะนัดของตนเองที่ไม่ใช่ draft
- [ ] Staff เห็นตารางแบบ read-only ตาม Requirement
- [ ] เชื่อมหน้ากลุ่มและรายการตารางนิเทศ

ผ่านเมื่อ: สร้างกลุ่มจากข้อมูลจริงและทั้งสาม role เห็นข้อมูลตามขอบเขตของตน

### Checkpoint 10 — Supervision Completion และ Evaluation

เป้าหมาย: ปิดรายการนิเทศพร้อมผลและแบบประเมินอย่างสอดคล้องกัน

- [x] Status/evaluation rules และ schema ระยะแรกแบบ 7 + 7 หัวข้อ
- [ ] Lecturer ผู้รับผิดชอบ/ผู้เข้าร่วมบันทึก schedule fields และ completion
- [ ] Actual lecturers อย่างน้อยหนึ่งคนและต้องมาจาก planned participants
- [ ] บันทึก result, actual participants และ evaluation drafts ใน transaction
- [ ] ล็อก result หลัง completed ตามกติกา
- [ ] Student evaluation ต่อ student ต่อ actual lecturer
- [ ] Company evaluation หนึ่งชุดต่อ appointment โดย actual lecturer ลำดับแรก
- [ ] Draft/submit; submitted แล้วแก้ไม่ได้
- [ ] Score `null`, `0`, `1..5` และ completeness aggregate
- [ ] ห้ามเปิดผลภายในให้นักศึกษา
- [ ] เชื่อมหน้า detail/result/evaluation และ progress view

ผ่านเมื่อ: completion ที่ข้อมูลไม่ครบ rollback ทั้งหมด และ evaluation completeness ถูกต้อง

### Checkpoint 11 — Notification, Calendar และ Dashboard

เป้าหมาย: แทน seed data ด้วย read model/aggregate จริงโดยไม่สร้างระบบรายงานเกินจำเป็น

- [x] Notification event schema และ recipient deduplication rule
- [ ] Notification + recipients ใน transaction และ public create service
- [ ] List ของตนเอง, mark read และ mark all read พร้อม ownership
- [ ] Calendar รวม supervision/document/deadline จาก source tables โดยไม่บันทึกซ้ำ
- [ ] Calendar filter ตาม role, current cycle และช่วงวันที่
- [ ] CRUD เฉพาะ custom `CalendarEvent` ที่ผู้ใช้เป็น owner
- [ ] Dashboard aggregate แยก Staff/Lecturer/Student และ current cycle
- [ ] Query aggregate ที่ฐานข้อมูล ไม่โหลดข้อมูลทั้งหมดมานับใน Node
- [ ] เชื่อมหน้า notifications, calendar และ dashboard

ผ่านเมื่อ: role และ cycle ต่างกันให้ผลลัพธ์ต่างกัน และไม่มีข้อมูลของคนอื่นรั่ว

### Checkpoint 12 — ตัด Mock และทดสอบ End-to-End

เป้าหมาย: ระบบจริงไม่พึ่ง prototype state ในเส้นทาง production

- [ ] เปลี่ยน data functions ใน composable เป็น `$fetch` โดยคง UI contract เดิม
- [ ] ปิด role/scenario switcher และ mock accounts ใน production
- [ ] ลบหรือแยก mock document endpoint ออกจาก production build
- [ ] ตรวจ Loading/Empty/Error/Data state หลังเชื่อม API
- [ ] E2E happy path ของทั้งสาม role
- [ ] E2E forbidden/ownership และ first-login flow
- [ ] Regression tests สำหรับ Placement → Supervision → Evaluation

ผ่านเมื่อ: restart app/database แล้ว flow หลักยังทำงานจากข้อมูล persisted จริง

### Checkpoint 13 — Production Readiness

เป้าหมาย: deploy และกู้ระบบได้ ไม่ใช่เพียงเปิดใช้งานได้ครั้งเดียว

- [ ] Docker image build จาก clean context ด้วย frozen lockfile
- [ ] Compose ไม่มี default production secret และไม่เปิด MySQL สู่ public network โดยไม่จำเป็น
- [ ] ใช้ SSH tunnel/VPN สำหรับ Navicat จากเครื่องอื่นแทนการเปิด port ฐานข้อมูลทั่วไป
- [ ] Upload volume/object storage มี backup และ permission สำหรับ non-root runtime
- [ ] MySQL backup/restore drill และ migration rollback/recovery runbook
- [ ] Structured logs, correlation ID, health/readiness และ graceful shutdown
- [ ] Smoke test ผ่าน topology เดียวกับ production
- [ ] รัน test, typecheck, lint, build, migration และ Docker checks ใน CI

ผ่านเมื่อ: deploy จากฐานข้อมูลว่าง, backup, restore และ restart stack ได้ตาม runbook

## 5. ลำดับ Dependency ที่ห้ามสลับ

```text
Foundation
  → Auth/RBAC/Audit
    → People + Company + Cycle
      → Student Applications
      → Placement Request
        → Letter/PDF + Confirmed Placement
          → Supervision Group/Schedule
            → Completion/Evaluation
              → Dashboard/Calendar/E2E/Production
```

Notification create service ควรเริ่มใน Placement checkpoint และขยาย endpoint ใน Checkpoint 11
เพื่อไม่ต้องย้อนแก้ Placement/Letter ภายหลัง

## 6. วิธีทำงานสำหรับคนเดียว

1. ใช้ branch หลักสำหรับ Backend เพียง branch เดียวในช่วงนี้ และไม่สลับระหว่าง
   `feature/backend-1` กับ `feature/backend-2`
2. หนึ่ง checkpoint แบ่ง commit เป็น: contract → service/repository → route → tests → UI integration
3. ก่อนเริ่ม checkpoint ให้เขียน acceptance case 3–6 ข้อจาก Requirement
4. ห้ามเริ่ม Feature ถัดไปหาก test ของ dependency ยังไม่ผ่าน
5. ใช้ `db push` เฉพาะทดลอง schema ก่อน freeze; หลัง initial migration ใช้ migration workflow เท่านั้น
6. ทุก mutation ต้องตอบคำถามให้ได้: ใครทำ, มีสิทธิ์หรือไม่, เปลี่ยนอะไร, transaction ใด,
   audit/notification ใด และ retry แล้วซ้ำหรือไม่
7. หลีกเลี่ยง generic repository, event bus, queue และ microservice สำหรับระบบภายในสาขา
8. ถ้า checkpoint ใหญ่เกิน 3–5 วัน ให้แบ่งตาม user-visible flow ไม่แบ่งตาม layer

### จุดตัดส่งมอบที่แนะนำ

- **ฐานระบบพร้อมพัฒนา:** Checkpoint 0–2
- **Master Data พร้อมใช้งาน:** Checkpoint 3–5
- **Core MVP สำหรับกระบวนการคำร้อง:** Checkpoint 6–8
- **MVP นิเทศครบวงจร:** Checkpoint 9–10 พร้อม notification ที่ flow หลักต้องใช้
- **พร้อมเปิดใช้จริง:** Checkpoint 11–13

ระยะเวลาโดยประมาณสำหรับคนเดียวแบบเต็มเวลาอยู่ที่ 35–55 วันทำการ ขึ้นกับการตัดสินใจ
เรื่อง PDF และ Appointment ที่ยังไม่ชัด ไม่ควรใช้ตัวเลขนี้เป็น deadline ก่อนปิด Checkpoint 0

## 7. Definition of Done ต่อ Checkpoint

- [ ] Route ตรวจ authentication/authorization ที่ server
- [ ] Params/query/body ผ่าน Zod
- [ ] Business rule อยู่ใน service และ Prisma query อยู่ใน repository
- [ ] Query ใช้ `select` หรือ bounded `include`; aggregate ทำใน database
- [ ] Multi-table mutation ใช้ transaction
- [ ] Ownership, inactive/locked state และ concurrent update ได้รับการตรวจ
- [ ] Important mutation มี Audit และ event ที่ผู้ใช้ต้องรู้มี Notification
- [ ] Unit/integration tests ครบ happy path กับ forbidden/error path
- [ ] UI ที่อยู่ใน scope ใช้ API จริงและรองรับ Loading/Empty/Error/Data
- [ ] `pnpm test`, `pnpm typecheck`, `pnpm lint` และ `pnpm build` ผ่าน
- [ ] Migration/seed และ Docker smoke test ผ่านเมื่อ checkpoint เปลี่ยน runtime/database

## 8. Public Contract ที่ Feature ใช้ร่วมกัน

Contract เหล่านี้ต้องกำหนดใน server code เพียงจุดเดียวและใช้ `select` เฉพาะ field ที่ระบุ

### Auth Context

```ts
type AuthContext = {
  userId: string
  role: 'STAFF' | 'LECTURER' | 'STUDENT'
  sessionVersion: number
  canReviewPlacements: boolean
}
```

Route ใช้ `requireUser`, `requireRole` และ `requirePlacementReviewer`
โดยไม่อ่านหรือถอด session cookie เอง

### Audit Service

```ts
recordAudit({
  actorUserId,
  action,
  entityType,
  entityId,
  reason,
  before,
  after,
  metadata,
})
```

### Notification Service

```ts
createNotification({
  type,
  severity,
  title,
  body,
  recipientUserIds,
  placementRequestId,
  letterBatchId,
  appointmentId,
})
```

Service ต้อง deduplicate recipients และสร้าง Notification/Recipient ใน transaction เดียวกัน

### Confirmed Placement Read Model

```text
placementRequestId
cycleId
studentUserId
companySiteId
confirmedAt
```

### Company Read Model

```text
companyId
companyName
companyStatus
companySiteId
siteName
provinceId
```

### Cycle/Enrollment Read Model

```text
cycleId
academicYear
term
status
enrollmentId
studentWorkStatus
```

## 9. API Inventory ขั้นต่ำ

รายการนี้รักษา endpoint contract จากแผนเดิมไว้ แต่สามารถปรับชื่อก่อน implement ได้ใน
Checkpoint 0 เท่านั้น หลังเชื่อม UI แล้วให้ถือเป็น public contract ของระบบ

### Foundation, Auth และ People

```text
GET             /api/health
POST            /api/auth/login
POST            /api/auth/logout
GET             /api/auth/session
POST            /api/auth/password/first-login
POST            /api/auth/password/change
POST            /api/staff/users/:id/reset-password
PATCH           /api/staff/users/:id/status
GET/POST        /api/people
GET/PATCH       /api/people/:id
POST            /api/people/import/preview
POST            /api/people/import/commit
GET             /api/people/export
```

### Company และ Cycle

```text
GET             /api/provinces
GET/POST        /api/companies
GET/PATCH/DELETE /api/companies/:id
POST            /api/companies/:id/status
POST            /api/companies/:id/sites
PATCH/DELETE    /api/companies/:id/sites/:siteId
POST            /api/companies/:id/sites/:siteId/status
GET/POST        /api/cycles
GET/PATCH       /api/cycles/:id
POST            /api/cycles/:id/status
GET             /api/cycles/:id/status-history
GET/POST        /api/cycles/:id/enrollments
PATCH           /api/cycles/:id/enrollments/:enrollmentId
POST            /api/cycles/:id/enrollments/:enrollmentId/reassign
GET             /api/cycles/current
```

### Applications, Placements, Letter และ Document

```text
GET/POST        /api/applications
GET/PATCH/DELETE /api/applications/:id
GET/POST        /api/placements
GET/PATCH       /api/placements/:id
POST            /api/placements/:id/submit
POST            /api/placements/:id/review
POST            /api/placements/:id/return
POST            /api/placements/:id/cancel
GET             /api/placements/:id/timeline
GET/POST        /api/letter-batches
GET             /api/letter-batches/:id
POST            /api/letter-batches/:id/publish
POST            /api/letter-batches/:id/documents
POST            /api/letter-batches/:id/members/:memberId/confirm
POST            /api/letter-batches/:id/members/:memberId/reject
GET             /api/documents/:id/download
```

### Supervision และ Evaluation

```text
GET/POST        /api/supervision/groups
GET/PATCH       /api/supervision/groups/:id
PUT             /api/supervision/groups/:id/lecturers
PUT             /api/supervision/groups/:id/companies
GET             /api/supervision/appointments
GET             /api/supervision/appointments/:id
POST            /api/supervision/appointments/:id/join
POST            /api/supervision/appointments/:id/leave
PATCH           /api/supervision/appointments/:id/status
PUT             /api/supervision/appointments/:id/actual-participants
PUT             /api/supervision/appointments/:id/result
GET/PUT         /api/evaluations/students/:appointmentStudentId
POST            /api/evaluations/students/:appointmentStudentId/submit
GET/PUT         /api/evaluations/companies/:appointmentId
POST            /api/evaluations/companies/:appointmentId/submit
GET             /api/evaluations/completeness
```

Endpoint เปลี่ยนสถานะ Appointment ที่ Checkpoint 0 ตัดออกจาก MVP ให้คง route read/result
ไว้ก่อน และไม่เปิด transition ที่ไม่มี UI หรือผู้รับผิดชอบชัดเจน

### Notification, Calendar และ Dashboard

```text
GET             /api/notifications
POST            /api/notifications/:id/read
POST            /api/notifications/read-all
GET/POST        /api/calendar
GET/PATCH/DELETE /api/calendar/:id
GET             /api/dashboard
```

## 10. Test Matrix ที่ห้ามตกหล่น

### Unit tests

- State transition ของ Cycle, Placement และ Appointment ทั้ง allowed/forbidden
- Permission matrix ของ Staff, Lecturer, Student และ `canReviewPlacements`
- Import validation รายแถวและ duplicate ภายในไฟล์
- Letter-batch compatibility
- PDF extension/MIME/magic bytes/size validation
- Evaluation score/completeness และ submitted lock
- Notification recipient deduplication

### Integration tests

- Login → session → protected endpoint → logout
- Reset/suspend ผู้ใช้แล้ว session เดิมใช้ไม่ได้
- Import เฉพาะแถวที่ผ่าน validation และ accepted batch สำเร็จทั้งหมดหรือ rollback ทั้งหมด
- บริษัทหรือ site ที่มี reference ถูก hard delete ไม่ได้
- ย้ายรอบแล้ว enrollment เดิมปิดและ enrollment ใหม่ถูกสร้างครบใน transaction
- นักศึกษาอ่าน/แก้ Application หรือ Placement ของคนอื่นไม่ได้
- Lecturer ที่ไม่มี `canReviewPlacements` ตรวจคำร้องไม่ได้
- ส่งคำร้องพร้อมกันแล้วไม่เกิด active request ซ้ำ
- สร้าง Letter Batch ล้มเหลวแล้วไม่เหลือ batch/member/history บางส่วน
- ผู้ไม่มีสิทธิ์ดาวน์โหลดเอกสารไม่ได้
- Lecturer/CompanySite ซ้ำในกลุ่ม cycle/round เดียวกันไม่ได้
- ผู้ที่ไม่ได้เข้าร่วมจริงประเมินไม่ได้
- Completion บันทึก result/actual participants ครบหรือ rollback ทั้งหมด
- Student ดู Appointment ของคนอื่นหรือคะแนนภายในไม่ได้
- ผู้ใช้ mark read Notification ของคนอื่นไม่ได้
- Dashboard และ Calendar เปลี่ยนตาม role/current cycle

### Optional integration test หลังยืนยัน scope

- Lecturer เข้าร่วม Appointment เวลาชนกันไม่ได้
- Appointment create/publish/postpone/cancel ทำตาม transition และ ownership

## 11. ขอบเขตเลื่อนไปหลัง MVP

- Appointment create/publish/postpone/cancel หากยังไม่มี UI/ผู้รับผิดชอบที่ยืนยัน
- การ merge บริษัทซ้ำและ approval workflow เต็มรูปแบบ
- นักศึกษา upload/download หนังสือ หากยังไม่ยืนยัน actor และ flow
- งบประมาณและค่าใช้จ่ายนิเทศ
- Background import/export job
- Custom evaluation rubric
- Reporting warehouse และรายงาน PDF/Excel นอกหน้าที่มีอยู่
- Workflow เปลี่ยนสถานประกอบการระหว่างฝึกและคำขอยกเลิกหลังออกหนังสือ
