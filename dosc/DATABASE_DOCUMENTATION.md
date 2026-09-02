# Database Documentation — CWIE BRU Co-op Supervision System

> เอกสารนี้จัดทำจาก `prisma/schema.prisma`, migration ที่ apply จริง, `dosc/database.dbml`, feature schema/rules/service, seed และ requirement ณ วันที่ 2 กันยายน 2569 โดยไม่ได้เปลี่ยนโครงสร้างฐานข้อมูล

## ภาพรวม Database

ฐานข้อมูล MySQL 8.4 LTS สำหรับระบบบริหารจัดการและนิเทศงานสหกิจศึกษา ครอบคลุมบัญชีและ RBAC, รอบสหกิจ, สถานประกอบการ, tracker การสมัคร, คำร้องและหนังสือ, การจัดกลุ่ม/นัด/ผลนิเทศ, แบบประเมิน, Notification และกิจกรรมปฏิทินส่วนตัว ใช้ Prisma ORM เป็น schema source of truth

- Tables: **25**
- Columns: **312**
- Enums: **24**
- Foreign-key Relationships: **51**
- Primary Key: ทุก Table มี PK
- PDF binary: เก็บใน file storage; MySQL เก็บเฉพาะ metadata ใน `letter_document_versions`
- Session: ใช้ encrypted cookie และ `users.sessionVersion`; ไม่มี session table

## จุดประสงค์ของ Database

1. รักษา source of truth ของบุคคล รอบ สถานประกอบการ และ workflow สหกิจ
2. บังคับ referential integrity, uniqueness และ cardinality ที่ฐานข้อมูลทำได้
3. เก็บ snapshot/history เพื่อให้หนังสือและ timeline เดิมไม่เปลี่ยนตาม master data
4. รองรับ RBAC/ownership และ transaction boundary ของแต่ละ feature
5. แยกข้อมูล master, transaction, junction และ log ให้ตรวจสอบย้อนหลังได้

## แหล่งข้อมูลที่ตรวจสอบ

- `prisma/schema.prisma` — Model, Enum, relation, index และ mapping ชื่อตาราง
- `prisma/migrations/20260901172042_init/migration.sql` และ corrective migration — DDL ที่ใช้จริง
- `dosc/database.dbml` — Diagram ที่ document ในงานนี้
- `server/features/**`, `server/core/audit.ts`, Authentication service — validation/rules และการใช้ field จริง
- `prisma/seed.ts` และ province seed — ค่า Master Data เริ่มต้น
- `dosc/database-design.md`, `backend-plan.md`, `requirement.md` — business rule และ feature scope
- UI composables/pages — ความหมาย label/status ใน prototype ที่ backend contract ต้องรองรับ

## รายการ Entity / Table ทั้งหมด

| Table | ประเภท | หน้าที่โดยย่อ | Columns |
|---|---|---|---:|
| `users` | Master Data / Authentication | เก็บบัญชีและข้อมูลบุคคลของ Staff, Lecturer และ Student ในตารางเดียว รวมบทบาท สถานะบัญชี การล็อกอิน และข้อมูลที่ใช้ยืนยัน session | 23 |
| `audit_logs` | History / Audit Log | เก็บหลักฐานการกระทำสำคัญของระบบ เช่น login, logout, เปลี่ยนรหัสผ่าน เปลี่ยนสถานะบัญชี และ mutation ของข้อมูล พร้อมบริบท request และค่าก่อน/หลัง | 13 |
| `coop_cycles` | Master Data / Workflow Configuration | เก็บนิยามรอบสหกิจตามปีการศึกษา ภาคเรียน รุ่น ช่วงรับคำร้อง ช่วงปฏิบัติงาน และสถานะของรอบ | 15 |
| `coop_cycle_status_history` | History Table | เก็บ timeline การเปลี่ยนสถานะของรอบสหกิจ พร้อมผู้ดำเนินการ เหตุผล และเวลา | 7 |
| `cycle_enrollments` | Transaction / Association | เก็บการเข้าร่วมรอบสหกิจของนักศึกษา พร้อม snapshot รุ่น/หมู่เรียน สถานะ enrollment และสถานะการปฏิบัติงาน | 14 |
| `provinces` | Lookup / Master Data | ทะเบียนจังหวัด 77 จังหวัดและภูมิภาค เป็น source of truth ของพื้นที่ โดยระบบไม่รับ region อิสระจาก Company | 6 |
| `companies` | Master Data | เก็บข้อมูลระดับนิติบุคคลของสถานประกอบการ แยกจากสาขาเพื่อไม่ให้ชื่อและเลขประจำตัวผู้เสียภาษีซ้ำเมื่อมีหลายสถานที่ | 9 |
| `company_sites` | Master Data / Child Entity | เก็บสาขาหรือสถานที่ปฏิบัติงาน ที่อยู่ จังหวัด และข้อมูลผู้ติดต่อของ Company แต่ละแห่ง; คำร้อง หนังสือ และการนิเทศอ้างอิงระดับสาขานี้ | 13 |
| `student_applications` | Transaction | เก็บรายการสมัครงาน/ฝึกงานส่วนตัวที่นักศึกษาใช้ติดตามได้หลายแห่งต่อ enrollment โดยไม่ใช่คำร้องขอออกหนังสือและไม่ยืนยันสถานที่ฝึก | 12 |
| `placement_requests` | Core Transaction | เก็บคำร้องทางการขอออกหนังสือ สถานประกอบการ ตำแหน่ง ผู้รับหนังสือ state machine ผลตอบรับ และสถานที่ฝึกที่ยืนยันแล้ว | 23 |
| `placement_request_status_history` | History Table | เก็บ timeline ทุกการเปลี่ยนสถานะของ Placement Request ใน transaction เดียวกับการแก้คำร้อง | 7 |
| `letter_batches` | Core Transaction | เก็บชุดคำร้องที่มี cycle, company site, ผู้รับ และที่อยู่ออกหนังสือตรงกัน พร้อม snapshot ข้อมูลสำหรับหนังสือและสถานะของชุด | 20 |
| `letter_batch_members` | Junction / Snapshot | เชื่อม Letter Batch กับ Placement Request และเก็บ snapshot นักศึกษา/ตำแหน่ง ณ เวลาจัดชุด เพื่อให้หนังสือเดิมไม่เปลี่ยนตาม Master Data | 12 |
| `letter_document_versions` | Transaction / File Metadata | เก็บ metadata และ version ของ PDF หนังสือขอฝึกงานหรือหนังสือตอบกลับ; binary อยู่ใน file storage ไม่ได้เก็บใน MySQL | 20 |
| `supervision_groups` | Transaction / Aggregate Root | เก็บกลุ่มนิเทศภายใต้รอบสหกิจและครั้งที่นิเทศ เป็นหัวรวมสำหรับอาจารย์และสาขาบริษัทที่รับผิดชอบ | 8 |
| `supervision_group_lecturers` | Junction / Mapping | เชื่อม Supervision Group กับ Lecturer และบังคับไม่ให้อาจารย์อยู่หลายกลุ่มใน cycle/round เดียวกัน | 6 |
| `supervision_group_companies` | Junction / Mapping | เชื่อม Supervision Group กับ Company Site และบังคับไม่ให้สาขาอยู่หลายกลุ่มใน cycle/round เดียวกัน | 6 |
| `supervision_appointments` | Core Transaction | เก็บรายการนัดนิเทศของสาขา วัน/ช่วงเวลา สถานะ เหตุผลการเปลี่ยนแปลง ผู้ดำเนินการ และผลการนิเทศร่วม | 22 |
| `supervision_appointment_lecturers` | Junction / Mapping | เชื่อม Appointment กับ Lecturer โดยแยกแหล่งที่มาของผู้เข้าร่วม บทบาทตามแผน และการเข้าร่วมจริง | 8 |
| `supervision_appointment_students` | Junction / Mapping | เชื่อม Appointment กับ Placement Request ที่ยืนยันแล้ว เพื่อระบุนักศึกษาที่ถูกนิเทศในนัดนั้น | 4 |
| `student_evaluations` | Transaction | เก็บแบบประเมินนักศึกษารายคนต่ออาจารย์ผู้ประเมิน มีคะแนน 7 หัวข้อ ข้อความประกอบ รุ่น rubric และสถานะ Draft/Submitted | 19 |
| `company_evaluations` | Transaction | เก็บแบบประเมินสถานประกอบการหนึ่งชุดต่อ Appointment มีคะแนน 7 หัวข้อ คำแนะนำ ข้อสังเกต และสถานะ Draft/Submitted | 19 |
| `notifications` | Transaction / Message | เก็บเนื้อหาการแจ้งเตือนหนึ่งเหตุการณ์และ optional link ไปยังธุรกรรมต้นทาง โดยแยกผู้รับออกเป็น NotificationRecipient เพื่อส่งข้อความเดียวให้หลายคน | 11 |
| `notification_recipients` | Junction / Delivery State | เชื่อม Notification กับ User แต่ละผู้รับ พร้อมเวลาส่งและเวลาอ่าน | 5 |
| `calendar_events` | Transaction / User-owned | เก็บกิจกรรมปฏิทินที่ผู้ใช้สร้างเอง; กิจกรรมระบบ เช่น Appointment และ deadline อ่านจากตารางต้นทางและไม่บันทึกซ้ำ | 10 |

## Enum และ Status

Enum ใน Prisma ใช้ UPPER_SNAKE_CASE; public API/UI map เป็น lower/kebab-case ที่ service boundary

### `UserRole`

| Value | ความหมาย |
|---|---|
| `STAFF` | เจ้าหน้าที่ผู้ดูแลข้อมูลและรอบสหกิจ |
| `LECTURER` | อาจารย์ผู้ตรวจคำร้อง/นิเทศ/ประเมิน |
| `STUDENT` | นักศึกษาผู้สมัครและยื่นคำร้อง |

### `AccountStatus`

| Value | ความหมาย |
|---|---|
| `FIRST_LOGIN` | ต้องตั้งรหัสผ่านใหม่ก่อนใช้ feature อื่น |
| `ACTIVE` | บัญชีพร้อมใช้งาน |
| `SUSPENDED` | ระงับชั่วคราว |
| `TERMINATED` | สิ้นสุดการใช้งาน |

### `RecordStatus`

| Value | ความหมาย |
|---|---|
| `ACTIVE` | รายการใช้งานได้ |
| `INACTIVE` | ยุติการใช้งานแต่เก็บประวัติ |

### `AcademicTerm`

| Value | ความหมาย |
|---|---|
| `FIRST` | ภาคเรียนที่ 1 |
| `SECOND` | ภาคเรียนที่ 2 |
| `SUMMER` | ภาคฤดูร้อน |
| `OTHER` | ภาคเรียนรูปแบบอื่น |

### `CoopCycleStatus`

| Value | ความหมาย |
|---|---|
| `DRAFT` | ร่างรอบ |
| `OPEN_FOR_REQUESTS` | เปิดรับคำร้อง |
| `CLOSED_TO_REQUESTS` | ปิดรับคำร้องใหม่ |
| `TRAINING` | อยู่ระหว่างปฏิบัติงาน |
| `CLOSED` | ปิดรอบ |

### `CycleEnrollmentStatus`

| Value | ความหมาย |
|---|---|
| `ACTIVE` | เข้าร่วมรอบปัจจุบัน |
| `TRANSFERRED_OUT` | ย้ายออกไปอีกรอบ |
| `COMPLETED` | จบรอบ |
| `TERMINATED` | ยุติการเข้าร่วม |

### `StudentWorkStatus`

| Value | ความหมาย |
|---|---|
| `NOT_STARTED` | ยังไม่เริ่มปฏิบัติงาน |
| `TRAINING` | กำลังปฏิบัติงาน |
| `COMPLETED` | ปฏิบัติงานเสร็จ |
| `TERMINATED` | ยุติการปฏิบัติงาน |

### `CompanyStatus`

| Value | ความหมาย |
|---|---|
| `PENDING` | รอตรวจสอบ |
| `ACTIVE` | ใช้งานได้ |
| `INACTIVE` | ยุติการใช้งาน |

### `RegionCode`

| Value | ความหมาย |
|---|---|
| `NORTH` | ภาคเหนือ |
| `NORTHEAST` | ภาคตะวันออกเฉียงเหนือ |
| `CENTRAL` | ภาคกลาง |
| `EAST` | ภาคตะวันออก |
| `WEST` | ภาคตะวันตก |
| `SOUTH` | ภาคใต้ |

### `TrackedApplicationStatus`

| Value | ความหมาย |
|---|---|
| `SUBMITTED` | ยื่นสมัครแล้ว |
| `WAITING_RESPONSE` | รอการตอบกลับ |
| `RESPONDED` | ได้รับการตอบกลับ |
| `WAITING_INTERVIEW` | รอสัมภาษณ์ |
| `ACCEPTED` | ผ่าน/ได้รับการตอบรับ |
| `REJECTED` | ไม่ผ่าน/ถูกปฏิเสธ |

### `PlacementRequestStatus`

| Value | ความหมาย |
|---|---|
| `DRAFT` | ฉบับร่าง |
| `SUBMITTED` | ส่งให้อาจารย์ตรวจ |
| `RETURNED` | ส่งกลับแก้ไข |
| `BATCHED` | รวมในชุดหนังสือ |
| `WAITING_RESPONSE` | รอหนังสือตอบกลับ |
| `WAITING_REVIEW` | รอตรวจผลตอบกลับ |
| `CONFIRMED` | ยืนยันสถานที่ฝึก |
| `NOT_ACCEPTED` | ไม่ได้รับการตอบรับ |
| `CANCELLED` | ยกเลิก |

### `LetterBatchStatus`

| Value | ความหมาย |
|---|---|
| `DRAFT` | กำลังจัดสมาชิก/เอกสาร |
| `WAITING_RESPONSE` | เผยแพร่แล้วและรอคำตอบ |
| `WAITING_REVIEW` | ได้รับเอกสารและรอตรวจ |
| `COMPLETED` | ตรวจผลครบแล้ว |
| `CANCELLED` | ยกเลิกชุด |

### `LetterDocumentType`

| Value | ความหมาย |
|---|---|
| `OUTGOING_REQUEST` | หนังสือขอฝึกงานที่ออกจากมหาวิทยาลัย |
| `COMPANY_RESPONSE` | หนังสือตอบกลับจากสถานประกอบการ |

### `DocumentVersionStatus`

| Value | ความหมาย |
|---|---|
| `ACTIVE` | version ที่ใช้งาน |
| `RETURNED` | ถูกส่งกลับให้แก้ไข |
| `SUPERSEDED` | ถูก version ใหม่แทนที่ |
| `CANCELLED` | ยกเลิก |

### `FileValidationStatus`

| Value | ความหมาย |
|---|---|
| `PENDING` | ยังไม่ตรวจไฟล์ |
| `VALID` | ผ่านการตรวจ |
| `INVALID` | ไม่ผ่านการตรวจ |

### `SupervisionRound`

| Value | ความหมาย |
|---|---|
| `ROUND_1` | นิเทศครั้งที่ 1 |
| `ROUND_2` | นิเทศครั้งที่ 2 |

### `SupervisionPeriod`

| Value | ความหมาย |
|---|---|
| `MORNING` | ช่วงเช้า |
| `AFTERNOON` | ช่วงบ่าย |

### `SupervisionAppointmentStatus`

| Value | ความหมาย |
|---|---|
| `DRAFT` | ยังไม่เผยแพร่ |
| `PUBLISHED` | เผยแพร่ให้ผู้เกี่ยวข้องแล้ว |
| `POSTPONED` | เลื่อนโดยยังไม่กำหนดใหม่ |
| `COMPLETED` | นิเทศเสร็จและล็อกผล |
| `CANCELLED` | ยกเลิก |

### `SupervisionParticipantSource`

| Value | ความหมาย |
|---|---|
| `GROUP` | มาจากสมาชิกกลุ่มนิเทศ |
| `MANUAL` | เพิ่มเฉพาะ Appointment |

### `SupervisionParticipantRole`

| Value | ความหมาย |
|---|---|
| `LEAD` | ผู้รับผิดชอบหลัก |
| `PARTICIPANT` | ผู้เข้าร่วม |

### `EvaluationStatus`

| Value | ความหมาย |
|---|---|
| `DRAFT` | บันทึกร่างและยังแก้ได้ |
| `SUBMITTED` | ส่งแล้วและต้องเป็น read-only |

### `CompanyRecommendation`

| Value | ความหมาย |
|---|---|
| `RECOMMENDED` | แนะนำให้ส่งนักศึกษารุ่นถัดไป |
| `CONDITIONAL` | แนะนำแบบมีเงื่อนไข |
| `FOLLOW_UP` | ต้องติดตามข้อมูลเพิ่ม |
| `NOT_RECOMMENDED` | ไม่แนะนำ |
| `SAFETY_RISK` | มีความเสี่ยงด้านความปลอดภัย |

### `NotificationSeverity`

| Value | ความหมาย |
|---|---|
| `INFO` | ข้อมูลทั่วไป |
| `WARNING` | คำเตือน/ต้องติดตาม |
| `SUCCESS` | ผลสำเร็จ |
| `ERROR` | ข้อผิดพลาด |

### `CalendarEventType`

| Value | ความหมาย |
|---|---|
| `SUPERVISION` | นัดนิเทศ |
| `DOCUMENT` | เอกสาร/คำร้อง |
| `DEADLINE` | กำหนดส่ง |
| `EVALUATION` | งานประเมิน |
| `GENERAL` | กิจกรรมทั่วไป |

## รายละเอียด Table และ Attribute

คำว่า **Nullable** หมายถึง column ยอมรับ `NULL`; **Required** หมายถึง `NOT NULL`. Default ที่เป็น `CURRENT_TIMESTAMP(3)` ทำงานเมื่อ insert ส่วน `updatedAt` ถูก Prisma อัปเดตด้วย `@updatedAt`

### `users`

**ประเภทตาราง:** Master Data / Authentication  
**หน้าที่ของตาราง:** เก็บบัญชีและข้อมูลบุคคลของ Staff, Lecturer และ Student ในตารางเดียว รวมบทบาท สถานะบัญชี การล็อกอิน และข้อมูลที่ใช้ยืนยัน session  
**ส่วนของระบบที่เกี่ยวข้อง:** Authentication, RBAC, People Master Data และการตรวจคำร้อง

| Attribute | Type | Key / Constraint | Nullable | Default | คำอธิบาย |
|---|---|---|---|---|---|
| `id` | `varchar(30)` | PK | No (Required) | `—` | รหัสหลักของ row |
| `username` | `varchar(100)` | Unique | No (Required) | `—` | ชื่อเข้าสู่ระบบ; ใช้เป็นรหัสนักศึกษา/รหัสอาจารย์/ชื่อผู้ใช้ Staff และห้ามซ้ำทั้งระบบ |
| `passwordHash` | `varchar(255)` | — | No (Required) | `—` | ค่า hash ของรหัสผ่าน ไม่เก็บรหัสผ่านแบบ plain text |
| `role` | `UserRole` | Enum UserRole | No (Required) | `—` | บทบาทหลักที่ใช้ทำ RBAC |
| `status` | `AccountStatus` | Enum AccountStatus | No (Required) | `'FIRST_LOGIN'` | สถานะบัญชีที่ควบคุม first-login, active, suspended และ terminated |
| `recordStatus` | `RecordStatus` | Enum RecordStatus | No (Required) | `'ACTIVE'` | สถานะเปิด/ปิดการใช้งานของข้อมูลโดยยังคงประวัติ |
| `namePrefix` | `varchar(50)` | — | No (Required) | `—` | คำนำหน้าชื่อ |
| `firstName` | `varchar(100)` | — | No (Required) | `—` | ชื่อจริง |
| `lastName` | `varchar(100)` | — | No (Required) | `—` | นามสกุล |
| `cohortYear` | `int` | — | Yes (Nullable) | `—` | ปีรุ่นของนักศึกษา; ใช้เฉพาะ role STUDENT |
| `section` | `varchar(50)` | — | Yes (Nullable) | `—` | หมู่เรียน/section ของนักศึกษา |
| `canReviewPlacements` | `boolean` | — | No (Required) | `false` | สิทธิ์พิเศษให้อาจารย์ตรวจคำร้องและจัดการเอกสาร Placement |
| `failedLoginCount` | `int` | — | No (Required) | `0` | จำนวนครั้งที่เข้าสู่ระบบผิดใน failure window ปัจจุบัน |
| `failedWindowAt` | `datetime(3)` | — | Yes (Nullable) | `—` | เวลาเริ่ม/ล่าสุดของช่วงนับ login failure |
| `lockedUntil` | `datetime(3)` | — | Yes (Nullable) | `—` | เวลาสิ้นสุดการล็อกบัญชีชั่วคราวจากการ login ผิด |
| `sessionVersion` | `int` | — | No (Required) | `1` | เลขรุ่น session; เพิ่มค่าเพื่อทำให้ session cookie เดิมใช้ไม่ได้ |
| `passwordChangedAt` | `datetime(3)` | — | Yes (Nullable) | `—` | เวลาที่เปลี่ยนรหัสผ่านสำเร็จล่าสุด |
| `suspendedAt` | `datetime(3)` | — | Yes (Nullable) | `—` | เวลาที่ระงับบัญชีชั่วคราว |
| `terminatedAt` | `datetime(3)` | — | Yes (Nullable) | `—` | เวลาที่ยุติบัญชี |
| `lastLoginAt` | `datetime(3)` | — | Yes (Nullable) | `—` | เวลา login สำเร็จล่าสุด |
| `createdById` | `varchar(30)` | FK → users.id | Yes (Nullable) | `—` | รหัส User ผู้สร้าง row |
| `createdAt` | `datetime(3)` | — | No (Required) | ``CURRENT_TIMESTAMP(3)`` | เวลาสร้าง row |
| `updatedAt` | `datetime(3)` | — | No (Required) | `—` | เวลาแก้ไข row ล่าสุด |

**Relationships**

- `users.createdById → users.id` — **Many-to-One (N:1)**, `ON DELETE SET NULL`: เก็บว่า User ใดสร้างบัญชีนี้ โดยคงบัญชีที่สร้างไว้เมื่อผู้สร้างถูกลบ
- `audit_logs.actorAccountId → users.id` — **One-to-Many (1:N)**, `ON DELETE SET NULL`: เชื่อม audit กับผู้กระทำเมื่อระบุตัวตนได้
- `coop_cycle_status_history.changedById → users.id` — **One-to-Many (1:N)**, `ON DELETE RESTRICT`: ระบุผู้ดำเนินการเปลี่ยนสถานะรอบ
- `cycle_enrollments.studentId → users.id` — **One-to-Many (1:N)**, `ON DELETE RESTRICT`: ระบุนักศึกษาของ enrollment
- `cycle_enrollments.createdById → users.id` — **One-to-Many (1:N)**, `ON DELETE RESTRICT`: ระบุเจ้าหน้าที่/ผู้สร้าง enrollment
- `companies.createdById → users.id` — **One-to-Many (1:N)**, `ON DELETE RESTRICT`: ระบุผู้สร้าง Company master data
- `placement_requests.confirmedById → users.id` — **One-to-Many (1:N)**, `ON DELETE SET NULL`: ระบุอาจารย์ผู้ยืนยันผลรายบุคคล
- `placement_request_status_history.changedById → users.id` — **One-to-Many (1:N)**, `ON DELETE RESTRICT`: ระบุผู้ทำ status transition
- `letter_batches.createdById → users.id` — **One-to-Many (1:N)**, `ON DELETE RESTRICT`: ระบุอาจารย์ผู้สร้างชุด
- `letter_batches.issuedById → users.id` — **One-to-Many (1:N)**, `ON DELETE SET NULL`: ระบุอาจารย์ผู้ออก/เผยแพร่หนังสือ
- `letter_document_versions.uploadedById → users.id` — **One-to-Many (1:N)**, `ON DELETE RESTRICT`: ระบุผู้รับผิดชอบการอัปโหลดไฟล์
- `letter_document_versions.reviewedById → users.id` — **One-to-Many (1:N)**, `ON DELETE SET NULL`: ระบุผู้ตรวจเอกสารเมื่อมีการ review
- `supervision_groups.createdById → users.id` — **One-to-Many (1:N)**, `ON DELETE RESTRICT`: ระบุ Staff ผู้สร้างกลุ่ม
- `supervision_group_lecturers.lecturerId → users.id` — **One-to-Many (1:N)**, `ON DELETE RESTRICT`: ระบุ User role LECTURER ที่เป็นสมาชิกกลุ่ม
- `supervision_appointments.createdById → users.id` — **One-to-Many (1:N)**, `ON DELETE RESTRICT`: ระบุผู้สร้าง Appointment
- `supervision_appointments.publishedById → users.id` — **One-to-Many (1:N)**, `ON DELETE SET NULL`: ระบุผู้เผยแพร่ Appointment
- `supervision_appointments.resultRecordedById → users.id` — **One-to-Many (1:N)**, `ON DELETE SET NULL`: ระบุอาจารย์ผู้บันทึกผลร่วม
- `supervision_appointment_lecturers.lecturerId → users.id` — **One-to-Many (1:N)**, `ON DELETE RESTRICT`: ระบุอาจารย์ตามแผน/ผู้เข้าร่วมจริง
- `student_evaluations.evaluatorLecturerId → users.id` — **One-to-Many (1:N)**, `ON DELETE RESTRICT`: ระบุอาจารย์เจ้าของแบบประเมิน
- `company_evaluations.evaluatorLecturerId → users.id` — **One-to-Many (1:N)**, `ON DELETE RESTRICT`: ระบุอาจารย์เจ้าของแบบประเมินสถานประกอบการ
- `notifications.createdById → users.id` — **One-to-Many (1:N)**, `ON DELETE SET NULL`: ระบุผู้สร้างข้อความเมื่อเป็น user action
- `notification_recipients.accountId → users.id` — **One-to-Many (1:N)**, `ON DELETE CASCADE`: ระบุ User ผู้รับและเก็บ read state แยกรายคน
- `calendar_events.ownerAccountId → users.id` — **One-to-Many (1:N)**, `ON DELETE CASCADE`: กำหนด ownership เพื่อให้ผู้ใช้เห็นและจัดการเฉพาะกิจกรรมของตน

**หมายเหตุ**

- หนึ่งบัญชีมีหนึ่ง role; STUDENT ต้องมี cohortYear; canReviewPlacements ใช้ได้เฉพาะ LECTURER; sessionVersion เพิ่มเมื่อจำเป็นต้องเพิกถอน session เดิม

---

### `audit_logs`

**ประเภทตาราง:** History / Audit Log  
**หน้าที่ของตาราง:** เก็บหลักฐานการกระทำสำคัญของระบบ เช่น login, logout, เปลี่ยนรหัสผ่าน เปลี่ยนสถานะบัญชี และ mutation ของข้อมูล พร้อมบริบท request และค่าก่อน/หลัง  
**ส่วนของระบบที่เกี่ยวข้อง:** Security, auditability และ troubleshooting

| Attribute | Type | Key / Constraint | Nullable | Default | คำอธิบาย |
|---|---|---|---|---|---|
| `id` | `bigint` | PK | No (Required) | `—` | รหัสหลักของ row |
| `actorAccountId` | `varchar(30)` | FK → users.id | Yes (Nullable) | `—` | รหัส User ผู้กระทำเหตุการณ์; ว่างได้เมื่อไม่ทราบตัวตน |
| `action` | `varchar(100)` | — | No (Required) | `—` | รหัสการกระทำที่ audit เช่น AUTH_LOGIN_SUCCESS |
| `entityType` | `varchar(100)` | — | No (Required) | `—` | ชนิด entity เป้าหมายของเหตุการณ์ |
| `entityId` | `varchar(100)` | — | No (Required) | `—` | รหัสของ entity เป้าหมาย; เป็น String เพื่อรองรับหลายชนิด |
| `reason` | `text` | — | Yes (Nullable) | `—` | เหตุผลประกอบการเปลี่ยนแปลง |
| `beforeData` | `json` | — | Yes (Nullable) | `—` | snapshot JSON ก่อนเปลี่ยนแปลง |
| `afterData` | `json` | — | Yes (Nullable) | `—` | snapshot JSON หลังเปลี่ยนแปลง |
| `metadata` | `json` | — | Yes (Nullable) | `—` | บริบทเพิ่มเติมแบบ JSON ที่ต่างกันตาม action |
| `correlationId` | `varchar(100)` | — | Yes (Nullable) | `—` | request/correlation id สำหรับติดตามเหตุการณ์ข้าม log |
| `ipAddress` | `varchar(45)` | — | Yes (Nullable) | `—` | IP address ของ request |
| `userAgent` | `text` | — | Yes (Nullable) | `—` | HTTP User-Agent ของผู้เรียก |
| `occurredAt` | `datetime(3)` | — | No (Required) | ``CURRENT_TIMESTAMP(3)`` | เวลาที่เหตุการณ์ audit เกิดขึ้น |

**Relationships**

- `audit_logs.actorAccountId → users.id` — **Many-to-One (N:1)**, `ON DELETE SET NULL`: เชื่อม audit กับผู้กระทำเมื่อระบุตัวตนได้

**หมายเหตุ**

- เป็น append-only ในการใช้งานปกติ; actorAccountId เป็น Nullable เพื่อเก็บเหตุการณ์ที่ยังไม่ทราบผู้ใช้ เช่น login ไม่สำเร็จ

---

### `coop_cycles`

**ประเภทตาราง:** Master Data / Workflow Configuration  
**หน้าที่ของตาราง:** เก็บนิยามรอบสหกิจตามปีการศึกษา ภาคเรียน รุ่น ช่วงรับคำร้อง ช่วงปฏิบัติงาน และสถานะของรอบ  
**ส่วนของระบบที่เกี่ยวข้อง:** Cycle context ที่ Placement, Letter และ Supervision ใช้ร่วมกัน

| Attribute | Type | Key / Constraint | Nullable | Default | คำอธิบาย |
|---|---|---|---|---|---|
| `id` | `varchar(30)` | PK | No (Required) | `—` | รหัสหลักของ row |
| `code` | `varchar(50)` | Unique | No (Required) | `—` | รหัสอ้างอิงที่มนุษย์อ่านได้และห้ามซ้ำ |
| `label` | `varchar(150)` | — | No (Required) | `—` | ชื่อแสดงผลของรอบสหกิจ |
| `academicYear` | `int` | Composite Unique (academicYear, term, targetCohortYear) | No (Required) | `—` | ปีการศึกษาของรอบ |
| `term` | `AcademicTerm` | Composite Unique (academicYear, term, targetCohortYear); Enum AcademicTerm | No (Required) | `—` | ภาคเรียนตาม AcademicTerm |
| `termLabel` | `varchar(100)` | — | No (Required) | `—` | ข้อความชื่อภาคเรียนสำหรับแสดงผล |
| `targetCohortYear` | `int` | Composite Unique (academicYear, term, targetCohortYear) | No (Required) | `—` | ปีรุ่นนักศึกษาเป้าหมายของรอบ |
| `requestStartDate` | `date` | — | No (Required) | `—` | วันเริ่มรับคำร้องสถานประกอบการ |
| `requestEndDate` | `date` | — | No (Required) | `—` | วันสิ้นสุดรับคำร้อง |
| `trainingStartDate` | `date` | — | No (Required) | `—` | วันเริ่มปฏิบัติงานสหกิจ |
| `trainingEndDate` | `date` | — | No (Required) | `—` | วันสิ้นสุดปฏิบัติงานสหกิจ |
| `status` | `CoopCycleStatus` | Enum CoopCycleStatus | No (Required) | `'DRAFT'` | สถานะ lifecycle ของรอบสหกิจ |
| `closedAt` | `datetime(3)` | — | Yes (Nullable) | `—` | เวลาที่ปิดรอบ |
| `createdAt` | `datetime(3)` | — | No (Required) | ``CURRENT_TIMESTAMP(3)`` | เวลาสร้าง row |
| `updatedAt` | `datetime(3)` | — | No (Required) | `—` | เวลาแก้ไข row ล่าสุด |

**Relationships**

- `coop_cycle_status_history.cycleId → coop_cycles.id` — **One-to-Many (1:N)**, `ON DELETE RESTRICT`: จัด timeline ให้รอบสหกิจที่ถูกเปลี่ยนสถานะ
- `cycle_enrollments.cycleId → coop_cycles.id` — **One-to-Many (1:N)**, `ON DELETE RESTRICT`: ระบุรอบที่นักศึกษาเข้าร่วม
- `letter_batches.cycleId → coop_cycles.id` — **One-to-Many (1:N)**, `ON DELETE RESTRICT`: กำหนดรอบของชุดหนังสือ
- `supervision_groups.cycleId → coop_cycles.id` — **One-to-Many (1:N)**, `ON DELETE RESTRICT`: กำหนดรอบของกลุ่มนิเทศ

**หมายเหตุ**

- ช่วงเริ่มต้องไม่อยู่หลังช่วงสิ้นสุด; combination academicYear + term + targetCohortYear ห้ามซ้ำ

---

### `coop_cycle_status_history`

**ประเภทตาราง:** History Table  
**หน้าที่ของตาราง:** เก็บ timeline การเปลี่ยนสถานะของรอบสหกิจ พร้อมผู้ดำเนินการ เหตุผล และเวลา  
**ส่วนของระบบที่เกี่ยวข้อง:** การบริหารรอบสหกิจและ Audit

| Attribute | Type | Key / Constraint | Nullable | Default | คำอธิบาย |
|---|---|---|---|---|---|
| `id` | `bigint` | PK | No (Required) | `—` | รหัสหลักของ row |
| `cycleId` | `varchar(30)` | FK → coop_cycles.id | No (Required) | `—` | รหัสรอบสหกิจที่ row นี้สังกัด |
| `fromStatus` | `CoopCycleStatus` | Enum CoopCycleStatus | Yes (Nullable) | `—` | สถานะเดิมก่อน transition; ว่างได้สำหรับเหตุการณ์เริ่มต้น |
| `toStatus` | `CoopCycleStatus` | Enum CoopCycleStatus | No (Required) | `—` | สถานะใหม่หลัง transition |
| `reason` | `text` | — | No (Required) | `—` | เหตุผลประกอบการเปลี่ยนแปลง |
| `changedById` | `varchar(30)` | FK → users.id | No (Required) | `—` | รหัส User ผู้เปลี่ยนสถานะ |
| `changedAt` | `datetime(3)` | — | No (Required) | ``CURRENT_TIMESTAMP(3)`` | เวลาที่เปลี่ยนสถานะ |

**Relationships**

- `coop_cycle_status_history.cycleId → coop_cycles.id` — **Many-to-One (N:1)**, `ON DELETE RESTRICT`: จัด timeline ให้รอบสหกิจที่ถูกเปลี่ยนสถานะ
- `coop_cycle_status_history.changedById → users.id` — **Many-to-One (N:1)**, `ON DELETE RESTRICT`: ระบุผู้ดำเนินการเปลี่ยนสถานะรอบ

**หมายเหตุ**

- การเปลี่ยนสถานะรอบควรสร้าง history ใน transaction เดียวกัน; reason เป็น Required

---

### `cycle_enrollments`

**ประเภทตาราง:** Transaction / Association  
**หน้าที่ของตาราง:** เก็บการเข้าร่วมรอบสหกิจของนักศึกษา พร้อม snapshot รุ่น/หมู่เรียน สถานะ enrollment และสถานะการปฏิบัติงาน  
**ส่วนของระบบที่เกี่ยวข้อง:** Student cycle context, Placement และ Application Tracker

| Attribute | Type | Key / Constraint | Nullable | Default | คำอธิบาย |
|---|---|---|---|---|---|
| `id` | `varchar(30)` | PK | No (Required) | `—` | รหัสหลักของ row |
| `cycleId` | `varchar(30)` | FK → coop_cycles.id; Composite Unique (cycleId, studentId) | No (Required) | `—` | รหัสรอบสหกิจที่ row นี้สังกัด |
| `studentId` | `varchar(30)` | FK → users.id; Composite Unique (cycleId, studentId) | No (Required) | `—` | รหัส User ของนักศึกษา |
| `cohortYearSnapshot` | `int` | — | No (Required) | `—` | snapshot ปีรุ่นเมื่อเข้ารอบ เพื่อไม่ให้ประวัติเปลี่ยนตาม User |
| `sectionSnapshot` | `varchar(50)` | — | Yes (Nullable) | `—` | snapshot หมู่เรียนเมื่อเข้ารอบ |
| `enrollmentStatus` | `CycleEnrollmentStatus` | Enum CycleEnrollmentStatus | No (Required) | `'ACTIVE'` | สถานะการเข้าร่วมรอบ |
| `workStatus` | `StudentWorkStatus` | Enum StudentWorkStatus | No (Required) | `'NOT_STARTED'` | สถานะการปฏิบัติงานของนักศึกษาในรอบ |
| `currentStudentKey` | `varchar(30)` | Unique | Yes (Nullable) | `—` | Nullable Unique Slot ที่ใส่ student id เฉพาะ enrollment ปัจจุบัน |
| `joinedAt` | `datetime(3)` | — | No (Required) | ``CURRENT_TIMESTAMP(3)`` | เวลาที่นักศึกษาเข้าร่วมรอบ |
| `exitedAt` | `datetime(3)` | — | Yes (Nullable) | `—` | เวลาที่ออก/ย้าย/ยุติจากรอบ |
| `exitReason` | `text` | — | Yes (Nullable) | `—` | เหตุผลที่ออกจากรอบ |
| `createdById` | `varchar(30)` | FK → users.id | No (Required) | `—` | รหัส User ผู้สร้าง row |
| `createdAt` | `datetime(3)` | — | No (Required) | ``CURRENT_TIMESTAMP(3)`` | เวลาสร้าง row |
| `updatedAt` | `datetime(3)` | — | No (Required) | `—` | เวลาแก้ไข row ล่าสุด |

**Relationships**

- `cycle_enrollments.cycleId → coop_cycles.id` — **Many-to-One (N:1)**, `ON DELETE RESTRICT`: ระบุรอบที่นักศึกษาเข้าร่วม
- `cycle_enrollments.studentId → users.id` — **Many-to-One (N:1)**, `ON DELETE RESTRICT`: ระบุนักศึกษาของ enrollment
- `cycle_enrollments.createdById → users.id` — **Many-to-One (N:1)**, `ON DELETE RESTRICT`: ระบุเจ้าหน้าที่/ผู้สร้าง enrollment
- `student_applications.enrollmentId → cycle_enrollments.id` — **One-to-Many (1:N)**, `ON DELETE RESTRICT`: กำหนด ownership และรอบของ tracker นักศึกษา
- `placement_requests.enrollmentId → cycle_enrollments.id` — **One-to-Many (1:N)**, `ON DELETE RESTRICT`: ผูกคำร้องกับนักศึกษาและรอบสหกิจ

**หมายเหตุ**

- นักศึกษาซ้ำในรอบเดียวกันไม่ได้; currentStudentKey ใช้ Nullable Unique Slot เพื่อบังคับ current enrollment หนึ่งรายการต่อคน

---

### `provinces`

**ประเภทตาราง:** Lookup / Master Data  
**หน้าที่ของตาราง:** ทะเบียนจังหวัด 77 จังหวัดและภูมิภาค เป็น source of truth ของพื้นที่ โดยระบบไม่รับ region อิสระจาก Company  
**ส่วนของระบบที่เกี่ยวข้อง:** Company Master Data, search และ filter ตามพื้นที่

| Attribute | Type | Key / Constraint | Nullable | Default | คำอธิบาย |
|---|---|---|---|---|---|
| `id` | `int` | PK | No (Required) | `—` | รหัสหลักของ row |
| `code` | `varchar(10)` | Unique | No (Required) | `—` | รหัสอ้างอิงที่มนุษย์อ่านได้และห้ามซ้ำ |
| `nameTh` | `varchar(100)` | Unique | No (Required) | `—` | ชื่อจังหวัดภาษาไทย |
| `region` | `RegionCode` | Enum RegionCode | No (Required) | `—` | ภูมิภาคของจังหวัดซึ่งเป็น source of truth |
| `createdAt` | `datetime(3)` | — | No (Required) | ``CURRENT_TIMESTAMP(3)`` | เวลาสร้าง row |
| `updatedAt` | `datetime(3)` | — | No (Required) | `—` | เวลาแก้ไข row ล่าสุด |

**Relationships**

- `company_sites.provinceId → provinces.id` — **One-to-Many (1:N)**, `ON DELETE RESTRICT`: อ่านจังหวัดและภูมิภาคของสาขาจากทะเบียนกลาง

**หมายเหตุ**

- region เป็น source of truth ของภูมิภาคและถูก seed จากทะเบียนจังหวัด

---

### `companies`

**ประเภทตาราง:** Master Data  
**หน้าที่ของตาราง:** เก็บข้อมูลระดับนิติบุคคลของสถานประกอบการ แยกจากสาขาเพื่อไม่ให้ชื่อและเลขประจำตัวผู้เสียภาษีซ้ำเมื่อมีหลายสถานที่  
**ส่วนของระบบที่เกี่ยวข้อง:** Company Master Data และการอนุมัติรายการที่ Student เสนอ

| Attribute | Type | Key / Constraint | Nullable | Default | คำอธิบาย |
|---|---|---|---|---|---|
| `id` | `varchar(30)` | PK | No (Required) | `—` | รหัสหลักของ row |
| `code` | `varchar(50)` | Unique | No (Required) | `—` | รหัสอ้างอิงที่มนุษย์อ่านได้และห้ามซ้ำ |
| `legalName` | `varchar(255)` | — | No (Required) | `—` | ชื่อนิติบุคคลตามกฎหมาย |
| `taxId` | `varchar(20)` | Unique | Yes (Nullable) | `—` | เลขประจำตัวผู้เสียภาษี; ว่างได้และเมื่อมีค่าต้องไม่ซ้ำ |
| `status` | `CompanyStatus` | Enum CompanyStatus | No (Required) | `'PENDING'` | สถานะ Company: PENDING, ACTIVE หรือ INACTIVE |
| `createdById` | `varchar(30)` | FK → users.id | No (Required) | `—` | รหัส User ผู้สร้าง row |
| `deactivatedAt` | `datetime(3)` | — | Yes (Nullable) | `—` | เวลาที่ยุติการใช้งาน Company |
| `createdAt` | `datetime(3)` | — | No (Required) | ``CURRENT_TIMESTAMP(3)`` | เวลาสร้าง row |
| `updatedAt` | `datetime(3)` | — | No (Required) | `—` | เวลาแก้ไข row ล่าสุด |

**Relationships**

- `companies.createdById → users.id` — **Many-to-One (N:1)**, `ON DELETE RESTRICT`: ระบุผู้สร้าง Company master data
- `company_sites.companyId → companies.id` — **One-to-Many (1:N)**, `ON DELETE RESTRICT`: จัดสาขาทั้งหมดให้อยู่ภายใต้ Company เดียว

**หมายเหตุ**

- ข้อมูลที่มีประวัติอ้างอิงควรเปลี่ยนเป็น INACTIVE แทน hard delete; Staff/Lecturer สร้างเป็น ACTIVE และรายการจาก Student เป็น PENDING ตามแผน backend

---

### `company_sites`

**ประเภทตาราง:** Master Data / Child Entity  
**หน้าที่ของตาราง:** เก็บสาขาหรือสถานที่ปฏิบัติงาน ที่อยู่ จังหวัด และข้อมูลผู้ติดต่อของ Company แต่ละแห่ง; คำร้อง หนังสือ และการนิเทศอ้างอิงระดับสาขานี้  
**ส่วนของระบบที่เกี่ยวข้อง:** Company, Placement, Letter และ Supervision

| Attribute | Type | Key / Constraint | Nullable | Default | คำอธิบาย |
|---|---|---|---|---|---|
| `id` | `varchar(30)` | PK | No (Required) | `—` | รหัสหลักของ row |
| `companyId` | `varchar(30)` | FK → companies.id; Composite Unique (companyId, branchName) | No (Required) | `—` | รหัส Company เจ้าของสาขา |
| `branchName` | `varchar(150)` | Composite Unique (companyId, branchName) | No (Required) | `'สำนักงานใหญ่'` | ชื่อสาขาหรือสถานที่ปฏิบัติงาน |
| `address` | `text` | — | No (Required) | `—` | ที่อยู่เต็มของสาขา |
| `provinceId` | `int` | FK → provinces.id | No (Required) | `—` | รหัสจังหวัดของสาขา |
| `postalCode` | `varchar(10)` | — | Yes (Nullable) | `—` | รหัสไปรษณีย์ |
| `contactName` | `varchar(150)` | — | Yes (Nullable) | `—` | ชื่อผู้ติดต่อของสาขา |
| `contactRole` | `varchar(150)` | — | Yes (Nullable) | `—` | ตำแหน่ง/หน่วยงานของผู้ติดต่อ |
| `contactPhone` | `varchar(50)` | — | Yes (Nullable) | `—` | หมายเลขโทรศัพท์ผู้ติดต่อ |
| `contactEmail` | `varchar(255)` | — | Yes (Nullable) | `—` | อีเมลผู้ติดต่อ |
| `recordStatus` | `RecordStatus` | Enum RecordStatus | No (Required) | `'ACTIVE'` | สถานะเปิด/ปิดการใช้งานของข้อมูลโดยยังคงประวัติ |
| `createdAt` | `datetime(3)` | — | No (Required) | ``CURRENT_TIMESTAMP(3)`` | เวลาสร้าง row |
| `updatedAt` | `datetime(3)` | — | No (Required) | `—` | เวลาแก้ไข row ล่าสุด |

**Relationships**

- `company_sites.companyId → companies.id` — **Many-to-One (N:1)**, `ON DELETE RESTRICT`: จัดสาขาทั้งหมดให้อยู่ภายใต้ Company เดียว
- `company_sites.provinceId → provinces.id` — **Many-to-One (N:1)**, `ON DELETE RESTRICT`: อ่านจังหวัดและภูมิภาคของสาขาจากทะเบียนกลาง
- `student_applications.companySiteId → company_sites.id` — **One-to-Many (1:N)**, `ON DELETE SET NULL`: เชื่อม tracker กับสาขาในทะเบียนเมื่อมีข้อมูลตรงกัน; SET NULL เพื่อรักษา snapshot
- `placement_requests.companySiteId → company_sites.id` — **One-to-Many (1:N)**, `ON DELETE RESTRICT`: ระบุสาขาที่ขอไปฝึก
- `letter_batches.companySiteId → company_sites.id` — **One-to-Many (1:N)**, `ON DELETE RESTRICT`: กำหนดสาขาปลายทางร่วมของชุดหนังสือ
- `supervision_group_companies.companySiteId → company_sites.id` — **One-to-Many (1:N)**, `ON DELETE RESTRICT`: ระบุสาขาที่กลุ่มรับผิดชอบ

**หมายเหตุ**

- companyId + branchName ห้ามซ้ำ; Company ที่มีหลายสาขาใช้ row แยก; region อ่านผ่าน provinceId

---

### `student_applications`

**ประเภทตาราง:** Transaction  
**หน้าที่ของตาราง:** เก็บรายการสมัครงาน/ฝึกงานส่วนตัวที่นักศึกษาใช้ติดตามได้หลายแห่งต่อ enrollment โดยไม่ใช่คำร้องขอออกหนังสือและไม่ยืนยันสถานที่ฝึก  
**ส่วนของระบบที่เกี่ยวข้อง:** Student Application Tracker และมุมมอง read-only ของ Staff/Lecturer

| Attribute | Type | Key / Constraint | Nullable | Default | คำอธิบาย |
|---|---|---|---|---|---|
| `id` | `varchar(30)` | PK | No (Required) | `—` | รหัสหลักของ row |
| `enrollmentId` | `varchar(30)` | FK → cycle_enrollments.id | No (Required) | `—` | รหัสการเข้าร่วมรอบของนักศึกษา |
| `companySiteId` | `varchar(30)` | FK → company_sites.id | Yes (Nullable) | `—` | รหัสสาขาหรือสถานที่ปฏิบัติงาน |
| `companyNameSnapshot` | `varchar(255)` | — | No (Required) | `—` | ชื่อบริษัท ณ เวลาบันทึก เพื่อรักษาประวัติ |
| `provinceSnapshot` | `varchar(100)` | — | No (Required) | `—` | ชื่อจังหวัด ณ เวลาบันทึก tracker |
| `positionTitle` | `varchar(150)` | — | No (Required) | `—` | ชื่อตำแหน่งที่สมัครหรือขอฝึก |
| `appliedDate` | `date` | — | No (Required) | `—` | วันที่นักศึกษาสมัครกับสถานประกอบการ |
| `status` | `TrackedApplicationStatus` | Enum TrackedApplicationStatus | No (Required) | `'SUBMITTED'` | สถานะที่นักศึกษาใช้ติดตามการสมัครส่วนตัว |
| `details` | `text` | — | Yes (Nullable) | `—` | รายละเอียดงานหรือหมายเหตุเพิ่มเติม |
| `responseDate` | `date` | — | Yes (Nullable) | `—` | วันที่ได้รับคำตอบจากสถานประกอบการ |
| `createdAt` | `datetime(3)` | — | No (Required) | ``CURRENT_TIMESTAMP(3)`` | เวลาสร้าง row |
| `updatedAt` | `datetime(3)` | — | No (Required) | `—` | เวลาแก้ไข row ล่าสุด |

**Relationships**

- `student_applications.enrollmentId → cycle_enrollments.id` — **Many-to-One (N:1)**, `ON DELETE RESTRICT`: กำหนด ownership และรอบของ tracker นักศึกษา
- `student_applications.companySiteId → company_sites.id` — **Many-to-One (N:1)**, `ON DELETE SET NULL`: เชื่อม tracker กับสาขาในทะเบียนเมื่อมีข้อมูลตรงกัน; SET NULL เพื่อรักษา snapshot

**หมายเหตุ**

- เป็น tracker อิสระจาก Placement Request; การเปลี่ยน status ไม่ยืนยันสถานที่ฝึกและไม่เปลี่ยน workStatus

---

### `placement_requests`

**ประเภทตาราง:** Core Transaction  
**หน้าที่ของตาราง:** เก็บคำร้องทางการขอออกหนังสือ สถานประกอบการ ตำแหน่ง ผู้รับหนังสือ state machine ผลตอบรับ และสถานที่ฝึกที่ยืนยันแล้ว  
**ส่วนของระบบที่เกี่ยวข้อง:** Student Placement, Lecturer Review, Letter Batch และ Confirmed Placement

| Attribute | Type | Key / Constraint | Nullable | Default | คำอธิบาย |
|---|---|---|---|---|---|
| `id` | `varchar(30)` | PK | No (Required) | `—` | รหัสหลักของ row |
| `requestNo` | `varchar(50)` | Unique | No (Required) | `—` | เลขที่คำร้องที่มนุษย์ใช้อ้างอิงและห้ามซ้ำ |
| `enrollmentId` | `varchar(30)` | FK → cycle_enrollments.id | No (Required) | `—` | รหัสการเข้าร่วมรอบของนักศึกษา |
| `companySiteId` | `varchar(30)` | FK → company_sites.id | No (Required) | `—` | รหัสสาขาหรือสถานที่ปฏิบัติงาน |
| `positionTitle` | `varchar(150)` | — | No (Required) | `—` | ชื่อตำแหน่งที่สมัครหรือขอฝึก |
| `details` | `text` | — | Yes (Nullable) | `—` | รายละเอียดงานหรือหมายเหตุเพิ่มเติม |
| `recipientName` | `varchar(150)` | — | No (Required) | `—` | ชื่อบุคคล/ตำแหน่งที่ขึ้นต้นคำเรียนในหนังสือ |
| `recipientRole` | `varchar(150)` | — | No (Required) | `—` | ตำแหน่งหรือหน่วยงานของผู้รับหนังสือ |
| `letterAddress` | `text` | — | No (Required) | `—` | ที่อยู่สำหรับออกหนังสือ |
| `status` | `PlacementRequestStatus` | Enum PlacementRequestStatus | No (Required) | `'DRAFT'` | สถานะ state machine ของคำร้องทางการ |
| `activeSlotKey` | `varchar(30)` | Unique | Yes (Nullable) | `—` | Nullable Unique Slot; ใส่ student user id เมื่อคำร้องยัง active |
| `confirmedSlotKey` | `varchar(30)` | Unique | Yes (Nullable) | `—` | Nullable Unique Slot; ใส่ enrollment id เมื่อคำร้อง CONFIRMED |
| `submittedAt` | `datetime(3)` | — | Yes (Nullable) | `—` | เวลาส่งรายการเข้าสู่ workflow หรือเวลาส่งแบบประเมิน |
| `returnedAt` | `datetime(3)` | — | Yes (Nullable) | `—` | เวลาที่ส่งคำร้องกลับให้แก้ไข |
| `completedAt` | `datetime(3)` | — | Yes (Nullable) | `—` | เวลาที่ workflow หรือนัดเสร็จสมบูรณ์ |
| `cancelledAt` | `datetime(3)` | — | Yes (Nullable) | `—` | เวลาที่ยกเลิก |
| `cancellationReason` | `text` | — | Yes (Nullable) | `—` | เหตุผลการยกเลิก |
| `confirmedPosition` | `varchar(150)` | — | Yes (Nullable) | `—` | ตำแหน่งฝึกที่สถานประกอบการยืนยัน |
| `resultNote` | `text` | — | Yes (Nullable) | `—` | หมายเหตุผลตอบรับรายบุคคล |
| `confirmedById` | `varchar(30)` | FK → users.id | Yes (Nullable) | `—` | รหัส User ผู้ยืนยันผลคำร้อง |
| `confirmedAt` | `datetime(3)` | — | Yes (Nullable) | `—` | เวลาที่ยืนยันผลหรือยืนยันการเข้าร่วม |
| `createdAt` | `datetime(3)` | — | No (Required) | ``CURRENT_TIMESTAMP(3)`` | เวลาสร้าง row |
| `updatedAt` | `datetime(3)` | — | No (Required) | `—` | เวลาแก้ไข row ล่าสุด |

**Relationships**

- `placement_requests.enrollmentId → cycle_enrollments.id` — **Many-to-One (N:1)**, `ON DELETE RESTRICT`: ผูกคำร้องกับนักศึกษาและรอบสหกิจ
- `placement_requests.companySiteId → company_sites.id` — **Many-to-One (N:1)**, `ON DELETE RESTRICT`: ระบุสาขาที่ขอไปฝึก
- `placement_requests.confirmedById → users.id` — **Many-to-One (N:1)**, `ON DELETE SET NULL`: ระบุอาจารย์ผู้ยืนยันผลรายบุคคล
- `placement_request_status_history.requestId → placement_requests.id` — **One-to-Many (1:N)**, `ON DELETE RESTRICT`: จัด timeline ให้คำร้องต้นทาง
- `letter_batch_members.requestId → placement_requests.id` — **One-to-Many (1:N)**, `ON DELETE RESTRICT`: ระบุคำร้องที่ถูกนำเข้าชุด
- `supervision_appointment_students.placementRequestId → placement_requests.id` — **One-to-Many (1:N)**, `ON DELETE RESTRICT`: อ้าง confirmed placement เป็น source of truth ของนักศึกษาและสาขา
- `notifications.placementRequestId → placement_requests.id` — **One-to-Many (1:N)**, `ON DELETE SET NULL`: เชื่อมข้อความกับคำร้องเพื่อเปิดรายละเอียดและติดตามต้นเหตุ

**หมายเหตุ**

- สถานะ active ใช้ activeSlotKey = student user id; CONFIRMED ใช้ confirmedSlotKey = enrollmentId; terminal status ต้องล้าง activeSlotKey

---

### `placement_request_status_history`

**ประเภทตาราง:** History Table  
**หน้าที่ของตาราง:** เก็บ timeline ทุกการเปลี่ยนสถานะของ Placement Request ใน transaction เดียวกับการแก้คำร้อง  
**ส่วนของระบบที่เกี่ยวข้อง:** Placement workflow, UI timeline และ Audit

| Attribute | Type | Key / Constraint | Nullable | Default | คำอธิบาย |
|---|---|---|---|---|---|
| `id` | `bigint` | PK | No (Required) | `—` | รหัสหลักของ row |
| `requestId` | `varchar(30)` | FK → placement_requests.id | No (Required) | `—` | รหัส Placement Request |
| `fromStatus` | `PlacementRequestStatus` | Enum PlacementRequestStatus | Yes (Nullable) | `—` | สถานะเดิมก่อน transition; ว่างได้สำหรับเหตุการณ์เริ่มต้น |
| `toStatus` | `PlacementRequestStatus` | Enum PlacementRequestStatus | No (Required) | `—` | สถานะใหม่หลัง transition |
| `reason` | `text` | — | Yes (Nullable) | `—` | เหตุผลประกอบการเปลี่ยนแปลง |
| `changedById` | `varchar(30)` | FK → users.id | No (Required) | `—` | รหัส User ผู้เปลี่ยนสถานะ |
| `changedAt` | `datetime(3)` | — | No (Required) | ``CURRENT_TIMESTAMP(3)`` | เวลาที่เปลี่ยนสถานะ |

**Relationships**

- `placement_request_status_history.requestId → placement_requests.id` — **Many-to-One (N:1)**, `ON DELETE RESTRICT`: จัด timeline ให้คำร้องต้นทาง
- `placement_request_status_history.changedById → users.id` — **Many-to-One (N:1)**, `ON DELETE RESTRICT`: ระบุผู้ทำ status transition

**หมายเหตุ**

- ต้องบันทึกทุก transition พร้อม actor; fromStatus เป็น Nullable สำหรับเหตุการณ์แรก

---

### `letter_batches`

**ประเภทตาราง:** Core Transaction  
**หน้าที่ของตาราง:** เก็บชุดคำร้องที่มี cycle, company site, ผู้รับ และที่อยู่ออกหนังสือตรงกัน พร้อม snapshot ข้อมูลสำหรับหนังสือและสถานะของชุด  
**ส่วนของระบบที่เกี่ยวข้อง:** การจัดทำและเผยแพร่หนังสือขอฝึกงาน/หนังสือตอบกลับ

| Attribute | Type | Key / Constraint | Nullable | Default | คำอธิบาย |
|---|---|---|---|---|---|
| `id` | `varchar(30)` | PK | No (Required) | `—` | รหัสหลักของ row |
| `batchNo` | `varchar(50)` | Unique | No (Required) | `—` | เลขที่ชุดหนังสือที่ใช้อ้างอิงและห้ามซ้ำ |
| `cycleId` | `varchar(30)` | FK → coop_cycles.id | No (Required) | `—` | รหัสรอบสหกิจที่ row นี้สังกัด |
| `companySiteId` | `varchar(30)` | FK → company_sites.id | No (Required) | `—` | รหัสสาขาหรือสถานที่ปฏิบัติงาน |
| `status` | `LetterBatchStatus` | Enum LetterBatchStatus | No (Required) | `'DRAFT'` | สถานะ workflow ของชุดหนังสือ |
| `companyNameSnapshot` | `varchar(255)` | — | No (Required) | `—` | ชื่อบริษัท ณ เวลาบันทึก เพื่อรักษาประวัติ |
| `branchNameSnapshot` | `varchar(150)` | — | No (Required) | `—` | ชื่อสาขา ณ เวลาออกหนังสือ |
| `companyAddressSnapshot` | `text` | — | No (Required) | `—` | ที่อยู่บริษัท ณ เวลาออกหนังสือ |
| `recipientNameSnapshot` | `varchar(150)` | — | No (Required) | `—` | ชื่อผู้รับ ณ เวลาออกหนังสือ |
| `recipientRoleSnapshot` | `varchar(150)` | — | No (Required) | `—` | ตำแหน่งผู้รับ ณ เวลาออกหนังสือ |
| `letterAddressSnapshot` | `text` | — | No (Required) | `—` | ที่อยู่ออกหนังสือ ณ เวลาออกหนังสือ |
| `letterDate` | `date` | — | Yes (Nullable) | `—` | วันที่ระบุบนหนังสือ |
| `issuedAt` | `datetime(3)` | — | Yes (Nullable) | `—` | เวลาที่ออกหนังสือ |
| `publishedAt` | `datetime(3)` | — | Yes (Nullable) | `—` | เวลาที่เผยแพร่ชุดหนังสือหรือนัด |
| `cancelledAt` | `datetime(3)` | — | Yes (Nullable) | `—` | เวลาที่ยกเลิก |
| `cancellationReason` | `text` | — | Yes (Nullable) | `—` | เหตุผลการยกเลิก |
| `createdById` | `varchar(30)` | FK → users.id | No (Required) | `—` | รหัส User ผู้สร้าง row |
| `issuedById` | `varchar(30)` | FK → users.id | Yes (Nullable) | `—` | รหัส User ผู้ออกหนังสือ |
| `createdAt` | `datetime(3)` | — | No (Required) | ``CURRENT_TIMESTAMP(3)`` | เวลาสร้าง row |
| `updatedAt` | `datetime(3)` | — | No (Required) | `—` | เวลาแก้ไข row ล่าสุด |

**Relationships**

- `letter_batches.cycleId → coop_cycles.id` — **Many-to-One (N:1)**, `ON DELETE RESTRICT`: กำหนดรอบของชุดหนังสือ
- `letter_batches.companySiteId → company_sites.id` — **Many-to-One (N:1)**, `ON DELETE RESTRICT`: กำหนดสาขาปลายทางร่วมของชุดหนังสือ
- `letter_batches.createdById → users.id` — **Many-to-One (N:1)**, `ON DELETE RESTRICT`: ระบุอาจารย์ผู้สร้างชุด
- `letter_batches.issuedById → users.id` — **Many-to-One (N:1)**, `ON DELETE SET NULL`: ระบุอาจารย์ผู้ออก/เผยแพร่หนังสือ
- `letter_batch_members.batchId → letter_batches.id` — **One-to-Many (1:N)**, `ON DELETE RESTRICT`: ระบุชุดที่ membership อยู่
- `letter_document_versions.batchId → letter_batches.id` — **One-to-Many (1:N)**, `ON DELETE RESTRICT`: จัด version เอกสารให้อยู่ภายใต้ชุดหนังสือ
- `notifications.letterBatchId → letter_batches.id` — **One-to-Many (1:N)**, `ON DELETE SET NULL`: เชื่อมข้อความกับชุดหนังสือ

**หมายเหตุ**

- สมาชิกต้องมี cycle/site/recipient/address ตรงกัน; DRAFT ยกเลิกได้และคืนคำร้อง; หลัง publish ไม่เปิดแก้สมาชิกใน MVP

---

### `letter_batch_members`

**ประเภทตาราง:** Junction / Snapshot  
**หน้าที่ของตาราง:** เชื่อม Letter Batch กับ Placement Request และเก็บ snapshot นักศึกษา/ตำแหน่ง ณ เวลาจัดชุด เพื่อให้หนังสือเดิมไม่เปลี่ยนตาม Master Data  
**ส่วนของระบบที่เกี่ยวข้อง:** Letter batching, membership history และ document generation

| Attribute | Type | Key / Constraint | Nullable | Default | คำอธิบาย |
|---|---|---|---|---|---|
| `id` | `varchar(30)` | PK | No (Required) | `—` | รหัสหลักของ row |
| `batchId` | `varchar(30)` | FK → letter_batches.id; Composite Unique (batchId, requestId) | No (Required) | `—` | รหัส Letter Batch |
| `requestId` | `varchar(30)` | FK → placement_requests.id; Composite Unique (batchId, requestId) | No (Required) | `—` | รหัส Placement Request |
| `activeMembershipKey` | `varchar(30)` | Unique | Yes (Nullable) | `—` | Nullable Unique Slot สำหรับป้องกันคำร้องอยู่ใน active batch มากกว่าหนึ่งชุด |
| `studentCodeSnapshot` | `varchar(50)` | — | No (Required) | `—` | snapshot รหัสนักศึกษาที่ใช้บนหนังสือ |
| `namePrefixSnapshot` | `varchar(50)` | — | No (Required) | `—` | snapshot คำนำหน้าชื่อนักศึกษา |
| `firstNameSnapshot` | `varchar(100)` | — | No (Required) | `—` | snapshot ชื่อนักศึกษา |
| `lastNameSnapshot` | `varchar(100)` | — | No (Required) | `—` | snapshot นามสกุลนักศึกษา |
| `positionSnapshot` | `varchar(150)` | — | No (Required) | `—` | snapshot ตำแหน่งฝึก |
| `addedAt` | `datetime(3)` | — | No (Required) | ``CURRENT_TIMESTAMP(3)`` | เวลาที่เพิ่มสมาชิกหรือผู้เข้าร่วม |
| `removedAt` | `datetime(3)` | — | Yes (Nullable) | `—` | เวลาที่นำสมาชิกออก; ว่างเมื่อยังเป็นสมาชิก |
| `lockedAt` | `datetime(3)` | — | Yes (Nullable) | `—` | เวลาที่ล็อก row ไม่ให้แก้ไขต่อ |

**Relationships**

- `letter_batch_members.batchId → letter_batches.id` — **Many-to-One (N:1)**, `ON DELETE RESTRICT`: ระบุชุดที่ membership อยู่
- `letter_batch_members.requestId → placement_requests.id` — **Many-to-One (N:1)**, `ON DELETE RESTRICT`: ระบุคำร้องที่ถูกนำเข้าชุด

**หมายเหตุ**

- batchId + requestId ห้ามซ้ำ; snapshot ที่ locked แล้วห้ามแก้; activeMembershipKey ป้องกันสมาชิก active ซ้ำข้าม batch

---

### `letter_document_versions`

**ประเภทตาราง:** Transaction / File Metadata  
**หน้าที่ของตาราง:** เก็บ metadata และ version ของ PDF หนังสือขอฝึกงานหรือหนังสือตอบกลับ; binary อยู่ใน file storage ไม่ได้เก็บใน MySQL  
**ส่วนของระบบที่เกี่ยวข้อง:** Document upload, validation, review, versioning และ download authorization

| Attribute | Type | Key / Constraint | Nullable | Default | คำอธิบาย |
|---|---|---|---|---|---|
| `id` | `varchar(30)` | PK | No (Required) | `—` | รหัสหลักของ row |
| `batchId` | `varchar(30)` | FK → letter_batches.id; Composite Unique (batchId, documentType, versionNumber) | No (Required) | `—` | รหัส Letter Batch |
| `documentType` | `LetterDocumentType` | Composite Unique (batchId, documentType, versionNumber); Enum LetterDocumentType | No (Required) | `—` | ประเภทเอกสารตาม LetterDocumentType |
| `versionNumber` | `int` | Composite Unique (batchId, documentType, versionNumber) | No (Required) | `—` | ลำดับ version ภายใน batch และ document type |
| `status` | `DocumentVersionStatus` | Enum DocumentVersionStatus | No (Required) | `'ACTIVE'` | สถานะของ document version |
| `storageKey` | `varchar(500)` | Unique | No (Required) | `—` | ตำแหน่งอ้างอิงไฟล์ใน storage; ไม่ใช่ binary และห้ามซ้ำ |
| `originalFileName` | `varchar(255)` | — | No (Required) | `—` | ชื่อไฟล์เดิมที่ผู้ใช้อัปโหลด |
| `mimeType` | `varchar(100)` | — | No (Required) | `—` | MIME type ที่ client/adapter แจ้ง |
| `detectedMimeType` | `varchar(100)` | — | Yes (Nullable) | `—` | MIME type ที่ตรวจจากเนื้อหาไฟล์ |
| `sizeBytes` | `bigint` | — | No (Required) | `—` | ขนาดไฟล์เป็น byte |
| `sha256` | `char(64)` | — | No (Required) | `—` | ค่า SHA-256 checksum สำหรับตรวจ integrity/ไฟล์ซ้ำ |
| `validationStatus` | `FileValidationStatus` | Enum FileValidationStatus | No (Required) | `'PENDING'` | ผลการตรวจไฟล์ |
| `validationError` | `text` | — | Yes (Nullable) | `—` | ข้อความสาเหตุเมื่อไฟล์ไม่ผ่าน validation |
| `validatedAt` | `datetime(3)` | — | Yes (Nullable) | `—` | เวลาที่ตรวจไฟล์เสร็จ |
| `uploadedById` | `varchar(30)` | FK → users.id | No (Required) | `—` | รหัส User ผู้อัปโหลด |
| `uploadedAt` | `datetime(3)` | — | No (Required) | ``CURRENT_TIMESTAMP(3)`` | เวลาอัปโหลด |
| `replacementReason` | `text` | — | Yes (Nullable) | `—` | เหตุผลที่สร้าง version ทดแทน |
| `reviewedById` | `varchar(30)` | FK → users.id | Yes (Nullable) | `—` | รหัส User ผู้ตรวจเอกสาร |
| `reviewedAt` | `datetime(3)` | — | Yes (Nullable) | `—` | เวลาตรวจเอกสาร |
| `reviewNote` | `text` | — | Yes (Nullable) | `—` | หมายเหตุจากการตรวจเอกสาร |

**Relationships**

- `letter_document_versions.batchId → letter_batches.id` — **Many-to-One (N:1)**, `ON DELETE RESTRICT`: จัด version เอกสารให้อยู่ภายใต้ชุดหนังสือ
- `letter_document_versions.uploadedById → users.id` — **Many-to-One (N:1)**, `ON DELETE RESTRICT`: ระบุผู้รับผิดชอบการอัปโหลดไฟล์
- `letter_document_versions.reviewedById → users.id` — **Many-to-One (N:1)**, `ON DELETE SET NULL`: ระบุผู้ตรวจเอกสารเมื่อมีการ review

**หมายเหตุ**

- PDF binary อยู่นอกฐานข้อมูล; version ห้ามซ้ำใน batch/type; storageKey ห้ามซ้ำ; ต้อง validate MIME, magic bytes, size และ SHA-256 ใน service

---

### `supervision_groups`

**ประเภทตาราง:** Transaction / Aggregate Root  
**หน้าที่ของตาราง:** เก็บกลุ่มนิเทศภายใต้รอบสหกิจและครั้งที่นิเทศ เป็นหัวรวมสำหรับอาจารย์และสาขาบริษัทที่รับผิดชอบ  
**ส่วนของระบบที่เกี่ยวข้อง:** Staff Supervision Group Management

| Attribute | Type | Key / Constraint | Nullable | Default | คำอธิบาย |
|---|---|---|---|---|---|
| `id` | `varchar(30)` | PK; Composite Unique (id, cycleId, round) | No (Required) | `—` | รหัสหลักของ row |
| `code` | `varchar(50)` | Unique | No (Required) | `—` | รหัสอ้างอิงที่มนุษย์อ่านได้และห้ามซ้ำ |
| `cycleId` | `varchar(30)` | FK → coop_cycles.id; Composite Unique (id, cycleId, round); Composite Unique (cycleId, round, name) | No (Required) | `—` | รหัสรอบสหกิจที่ row นี้สังกัด |
| `round` | `SupervisionRound` | Composite Unique (id, cycleId, round); Composite Unique (cycleId, round, name); Enum SupervisionRound | No (Required) | `—` | ครั้งที่นิเทศตาม SupervisionRound |
| `name` | `varchar(150)` | Composite Unique (cycleId, round, name) | No (Required) | `—` | ชื่อกลุ่มนิเทศ |
| `createdById` | `varchar(30)` | FK → users.id | No (Required) | `—` | รหัส User ผู้สร้าง row |
| `createdAt` | `datetime(3)` | — | No (Required) | ``CURRENT_TIMESTAMP(3)`` | เวลาสร้าง row |
| `updatedAt` | `datetime(3)` | — | No (Required) | `—` | เวลาแก้ไข row ล่าสุด |

**Relationships**

- `supervision_groups.cycleId → coop_cycles.id` — **Many-to-One (N:1)**, `ON DELETE RESTRICT`: กำหนดรอบของกลุ่มนิเทศ
- `supervision_groups.createdById → users.id` — **Many-to-One (N:1)**, `ON DELETE RESTRICT`: ระบุ Staff ผู้สร้างกลุ่ม
- `supervision_group_lecturers.groupId,cycleId,round → supervision_groups.id,cycleId,round` — **One-to-Many (1:N)**, `ON DELETE RESTRICT`: ผูกอาจารย์กับกลุ่มเดียวกันอย่างสอดคล้องทั้ง id, cycle และ round
- `supervision_group_companies.groupId,cycleId,round → supervision_groups.id,cycleId,round` — **One-to-Many (1:N)**, `ON DELETE RESTRICT`: ผูก Company Site assignment กับกลุ่มใน cycle/round เดียวกัน

**หมายเหตุ**

- ชื่อกลุ่มห้ามซ้ำใน cycle/round; composite unique id + cycleId + round รองรับ composite FK ของ mapping tables

---

### `supervision_group_lecturers`

**ประเภทตาราง:** Junction / Mapping  
**หน้าที่ของตาราง:** เชื่อม Supervision Group กับ Lecturer และบังคับไม่ให้อาจารย์อยู่หลายกลุ่มใน cycle/round เดียวกัน  
**ส่วนของระบบที่เกี่ยวข้อง:** การมอบหมายอาจารย์นิเทศและ ownership

| Attribute | Type | Key / Constraint | Nullable | Default | คำอธิบาย |
|---|---|---|---|---|---|
| `id` | `varchar(30)` | PK | No (Required) | `—` | รหัสหลักของ row |
| `groupId` | `varchar(30)` | FK → supervision_groups.id,cycleId,round | No (Required) | `—` | รหัส Supervision Group |
| `cycleId` | `varchar(30)` | FK → supervision_groups.id,cycleId,round; Composite Unique (cycleId, round, lecturerId) | No (Required) | `—` | รหัสรอบสหกิจที่ row นี้สังกัด |
| `round` | `SupervisionRound` | FK → supervision_groups.id,cycleId,round; Composite Unique (cycleId, round, lecturerId); Enum SupervisionRound | No (Required) | `—` | ครั้งที่นิเทศตาม SupervisionRound |
| `lecturerId` | `varchar(30)` | FK → users.id; Composite Unique (cycleId, round, lecturerId) | No (Required) | `—` | รหัส User ของอาจารย์นิเทศ |
| `assignedAt` | `datetime(3)` | — | No (Required) | ``CURRENT_TIMESTAMP(3)`` | เวลามอบหมายเข้ากลุ่ม/นัด |

**Relationships**

- `supervision_group_lecturers.groupId,cycleId,round → supervision_groups.id,cycleId,round` — **Many-to-One (N:1)**, `ON DELETE RESTRICT`: ผูกอาจารย์กับกลุ่มเดียวกันอย่างสอดคล้องทั้ง id, cycle และ round
- `supervision_group_lecturers.lecturerId → users.id` — **Many-to-One (N:1)**, `ON DELETE RESTRICT`: ระบุ User role LECTURER ที่เป็นสมาชิกกลุ่ม

**หมายเหตุ**

- อาจารย์หนึ่งคนอยู่ได้หนึ่งกลุ่มต่อ cycle/round; service ต้องยืนยันว่า lecturerId เป็น User role LECTURER ที่ใช้งานอยู่

---

### `supervision_group_companies`

**ประเภทตาราง:** Junction / Mapping  
**หน้าที่ของตาราง:** เชื่อม Supervision Group กับ Company Site และบังคับไม่ให้สาขาอยู่หลายกลุ่มใน cycle/round เดียวกัน  
**ส่วนของระบบที่เกี่ยวข้อง:** การแบ่งความรับผิดชอบสถานประกอบการและการสร้าง Appointment

| Attribute | Type | Key / Constraint | Nullable | Default | คำอธิบาย |
|---|---|---|---|---|---|
| `id` | `varchar(30)` | PK | No (Required) | `—` | รหัสหลักของ row |
| `groupId` | `varchar(30)` | FK → supervision_groups.id,cycleId,round | No (Required) | `—` | รหัส Supervision Group |
| `cycleId` | `varchar(30)` | FK → supervision_groups.id,cycleId,round; Composite Unique (cycleId, round, companySiteId) | No (Required) | `—` | รหัสรอบสหกิจที่ row นี้สังกัด |
| `round` | `SupervisionRound` | FK → supervision_groups.id,cycleId,round; Composite Unique (cycleId, round, companySiteId); Enum SupervisionRound | No (Required) | `—` | ครั้งที่นิเทศตาม SupervisionRound |
| `companySiteId` | `varchar(30)` | FK → company_sites.id; Composite Unique (cycleId, round, companySiteId) | No (Required) | `—` | รหัสสาขาหรือสถานที่ปฏิบัติงาน |
| `assignedAt` | `datetime(3)` | — | No (Required) | ``CURRENT_TIMESTAMP(3)`` | เวลามอบหมายเข้ากลุ่ม/นัด |

**Relationships**

- `supervision_group_companies.groupId,cycleId,round → supervision_groups.id,cycleId,round` — **Many-to-One (N:1)**, `ON DELETE RESTRICT`: ผูก Company Site assignment กับกลุ่มใน cycle/round เดียวกัน
- `supervision_group_companies.companySiteId → company_sites.id` — **Many-to-One (N:1)**, `ON DELETE RESTRICT`: ระบุสาขาที่กลุ่มรับผิดชอบ
- `supervision_appointments.groupCompanyId → supervision_group_companies.id` — **One-to-Many (1:N)**, `ON DELETE RESTRICT`: สร้างนัดภายใต้ assignment ของกลุ่มต่อสาขา

**หมายเหตุ**

- Company Site หนึ่งแห่งอยู่ได้หนึ่งกลุ่มต่อ cycle/round; Appointment ถูกสร้างจาก assignment นี้

---

### `supervision_appointments`

**ประเภทตาราง:** Core Transaction  
**หน้าที่ของตาราง:** เก็บรายการนัดนิเทศของสาขา วัน/ช่วงเวลา สถานะ เหตุผลการเปลี่ยนแปลง ผู้ดำเนินการ และผลการนิเทศร่วม  
**ส่วนของระบบที่เกี่ยวข้อง:** Supervision schedule, completion และ evaluation

| Attribute | Type | Key / Constraint | Nullable | Default | คำอธิบาย |
|---|---|---|---|---|---|
| `id` | `varchar(30)` | PK | No (Required) | `—` | รหัสหลักของ row |
| `appointmentNo` | `varchar(50)` | Unique | No (Required) | `—` | เลขที่ Appointment ที่มนุษย์ใช้อ้างอิงและห้ามซ้ำ |
| `groupCompanyId` | `varchar(30)` | FK → supervision_group_companies.id | No (Required) | `—` | รหัส assignment ระหว่างกลุ่มกับ Company Site |
| `scheduledDate` | `date` | — | Yes (Nullable) | `—` | วันที่กำหนดนิเทศ |
| `period` | `SupervisionPeriod` | Enum SupervisionPeriod | Yes (Nullable) | `—` | ช่วงเวลานิเทศเช้าหรือบ่าย |
| `status` | `SupervisionAppointmentStatus` | Enum SupervisionAppointmentStatus | No (Required) | `'DRAFT'` | สถานะ lifecycle ของ Appointment |
| `splitReason` | `text` | — | Yes (Nullable) | `—` | เหตุผลที่แยกการนิเทศของ Company Site เป็นมากกว่าหนึ่ง Appointment |
| `postponementReason` | `text` | — | Yes (Nullable) | `—` | เหตุผลการเลื่อนนัด |
| `cancellationReason` | `text` | — | Yes (Nullable) | `—` | เหตุผลการยกเลิก |
| `publishedAt` | `datetime(3)` | — | Yes (Nullable) | `—` | เวลาที่เผยแพร่ชุดหนังสือหรือนัด |
| `completedAt` | `datetime(3)` | — | Yes (Nullable) | `—` | เวลาที่ workflow หรือนัดเสร็จสมบูรณ์ |
| `lockedAt` | `datetime(3)` | — | Yes (Nullable) | `—` | เวลาที่ล็อก row ไม่ให้แก้ไขต่อ |
| `resultSummary` | `longtext` | — | Yes (Nullable) | `—` | สรุปภาพรวมผลการนิเทศ |
| `resultIssues` | `longtext` | — | Yes (Nullable) | `—` | ปัญหาที่พบระหว่างนิเทศ |
| `resultSuggestions` | `longtext` | — | Yes (Nullable) | `—` | ข้อเสนอแนะจากการนิเทศ |
| `companyRequirements` | `longtext` | — | Yes (Nullable) | `—` | ความต้องการหรือข้อมูลที่สถานประกอบการแจ้ง |
| `resultRecordedById` | `varchar(30)` | FK → users.id | Yes (Nullable) | `—` | รหัส User ผู้บันทึกผลนิเทศ |
| `resultRecordedAt` | `datetime(3)` | — | Yes (Nullable) | `—` | เวลาบันทึกผลนิเทศ |
| `createdById` | `varchar(30)` | FK → users.id | No (Required) | `—` | รหัส User ผู้สร้าง row |
| `publishedById` | `varchar(30)` | FK → users.id | Yes (Nullable) | `—` | รหัส User ผู้เผยแพร่นัด |
| `createdAt` | `datetime(3)` | — | No (Required) | ``CURRENT_TIMESTAMP(3)`` | เวลาสร้าง row |
| `updatedAt` | `datetime(3)` | — | No (Required) | `—` | เวลาแก้ไข row ล่าสุด |

**Relationships**

- `supervision_appointments.groupCompanyId → supervision_group_companies.id` — **Many-to-One (N:1)**, `ON DELETE RESTRICT`: สร้างนัดภายใต้ assignment ของกลุ่มต่อสาขา
- `supervision_appointments.createdById → users.id` — **Many-to-One (N:1)**, `ON DELETE RESTRICT`: ระบุผู้สร้าง Appointment
- `supervision_appointments.publishedById → users.id` — **Many-to-One (N:1)**, `ON DELETE SET NULL`: ระบุผู้เผยแพร่ Appointment
- `supervision_appointments.resultRecordedById → users.id` — **Many-to-One (N:1)**, `ON DELETE SET NULL`: ระบุอาจารย์ผู้บันทึกผลร่วม
- `supervision_appointment_lecturers.appointmentId → supervision_appointments.id` — **One-to-Many (1:N)**, `ON DELETE RESTRICT`: จัดผู้เข้าร่วมให้อยู่ใน Appointment
- `supervision_appointment_students.appointmentId → supervision_appointments.id` — **One-to-Many (1:N)**, `ON DELETE RESTRICT`: จัดนักศึกษาให้อยู่ใน Appointment
- `company_evaluations.appointmentId → supervision_appointments.id` — **One-to-One (1:1)**, `ON DELETE RESTRICT`: บังคับ Company Evaluation หนึ่งชุดต่อ Appointment
- `notifications.appointmentId → supervision_appointments.id` — **One-to-Many (1:N)**, `ON DELETE SET NULL`: เชื่อมข้อความกับ Appointment

**หมายเหตุ**

- MVP รองรับ DRAFT → PUBLISHED → COMPLETED; completed/cancelled ถือว่าล็อก; actual lecturers ต้องมาจาก planned participants

---

### `supervision_appointment_lecturers`

**ประเภทตาราง:** Junction / Mapping  
**หน้าที่ของตาราง:** เชื่อม Appointment กับ Lecturer โดยแยกแหล่งที่มาของผู้เข้าร่วม บทบาทตามแผน และการเข้าร่วมจริง  
**ส่วนของระบบที่เกี่ยวข้อง:** Planned/actual supervision participants และสิทธิ์จัดการนัด

| Attribute | Type | Key / Constraint | Nullable | Default | คำอธิบาย |
|---|---|---|---|---|---|
| `id` | `varchar(30)` | PK | No (Required) | `—` | รหัสหลักของ row |
| `appointmentId` | `varchar(30)` | FK → supervision_appointments.id; Composite Unique (appointmentId, lecturerId) | No (Required) | `—` | รหัส Supervision Appointment |
| `lecturerId` | `varchar(30)` | FK → users.id; Composite Unique (appointmentId, lecturerId) | No (Required) | `—` | รหัส User ของอาจารย์นิเทศ |
| `source` | `SupervisionParticipantSource` | Enum SupervisionParticipantSource | No (Required) | `—` | แหล่งที่มาของผู้เข้าร่วมตาม Group หรือ Manual |
| `role` | `SupervisionParticipantRole` | Enum SupervisionParticipantRole | No (Required) | `'PARTICIPANT'` | บทบาทของอาจารย์ใน Appointment: LEAD หรือ PARTICIPANT |
| `isActual` | `boolean` | — | No (Required) | `false` | ระบุว่าอาจารย์เข้าร่วมนิเทศจริง |
| `addedAt` | `datetime(3)` | — | No (Required) | ``CURRENT_TIMESTAMP(3)`` | เวลาที่เพิ่มสมาชิกหรือผู้เข้าร่วม |
| `confirmedAt` | `datetime(3)` | — | Yes (Nullable) | `—` | เวลาที่ยืนยันผลหรือยืนยันการเข้าร่วม |

**Relationships**

- `supervision_appointment_lecturers.appointmentId → supervision_appointments.id` — **Many-to-One (N:1)**, `ON DELETE RESTRICT`: จัดผู้เข้าร่วมให้อยู่ใน Appointment
- `supervision_appointment_lecturers.lecturerId → users.id` — **Many-to-One (N:1)**, `ON DELETE RESTRICT`: ระบุอาจารย์ตามแผน/ผู้เข้าร่วมจริง

**หมายเหตุ**

- appointmentId + lecturerId ห้ามซ้ำ; isActual ใช้บันทึกผู้เข้าร่วมจริงหลังนิเทศ

---

### `supervision_appointment_students`

**ประเภทตาราง:** Junction / Mapping  
**หน้าที่ของตาราง:** เชื่อม Appointment กับ Placement Request ที่ยืนยันแล้ว เพื่อระบุนักศึกษาที่ถูกนิเทศในนัดนั้น  
**ส่วนของระบบที่เกี่ยวข้อง:** Student supervision schedule และ Student Evaluation

| Attribute | Type | Key / Constraint | Nullable | Default | คำอธิบาย |
|---|---|---|---|---|---|
| `id` | `varchar(30)` | PK | No (Required) | `—` | รหัสหลักของ row |
| `appointmentId` | `varchar(30)` | FK → supervision_appointments.id; Composite Unique (appointmentId, placementRequestId) | No (Required) | `—` | รหัส Supervision Appointment |
| `placementRequestId` | `varchar(30)` | FK → placement_requests.id; Composite Unique (appointmentId, placementRequestId) | No (Required) | `—` | รหัส Placement Request ที่ยืนยันแล้วและถูกนัดนิเทศ |
| `assignedAt` | `datetime(3)` | — | No (Required) | ``CURRENT_TIMESTAMP(3)`` | เวลามอบหมายเข้ากลุ่ม/นัด |

**Relationships**

- `supervision_appointment_students.appointmentId → supervision_appointments.id` — **Many-to-One (N:1)**, `ON DELETE RESTRICT`: จัดนักศึกษาให้อยู่ใน Appointment
- `supervision_appointment_students.placementRequestId → placement_requests.id` — **Many-to-One (N:1)**, `ON DELETE RESTRICT`: อ้าง confirmed placement เป็น source of truth ของนักศึกษาและสาขา
- `student_evaluations.appointmentStudentId → supervision_appointment_students.id` — **One-to-Many (1:N)**, `ON DELETE RESTRICT`: ระบุนักศึกษาที่ถูกประเมินใน Appointment

**หมายเหตุ**

- ต้องอ้าง Placement Request สถานะ CONFIRMED ใน cycle/site เดียวกับ Appointment

---

### `student_evaluations`

**ประเภทตาราง:** Transaction  
**หน้าที่ของตาราง:** เก็บแบบประเมินนักศึกษารายคนต่ออาจารย์ผู้ประเมิน มีคะแนน 7 หัวข้อ ข้อความประกอบ รุ่น rubric และสถานะ Draft/Submitted  
**ส่วนของระบบที่เกี่ยวข้อง:** Post-supervision Student Evaluation

| Attribute | Type | Key / Constraint | Nullable | Default | คำอธิบาย |
|---|---|---|---|---|---|
| `id` | `varchar(30)` | PK | No (Required) | `—` | รหัสหลักของ row |
| `appointmentStudentId` | `varchar(30)` | FK → supervision_appointment_students.id; Composite Unique (appointmentStudentId, evaluatorLecturerId) | No (Required) | `—` | รหัส mapping นักศึกษาภายใน Appointment |
| `evaluatorLecturerId` | `varchar(30)` | FK → users.id; Composite Unique (appointmentStudentId, evaluatorLecturerId) | No (Required) | `—` | รหัส User ของอาจารย์ผู้ประเมิน |
| `rubricVersion` | `int` | — | No (Required) | `1` | เลขรุ่นแบบประเมินที่ใช้ เพื่อแปลความหมายคะแนนย้อนหลัง |
| `status` | `EvaluationStatus` | Enum EvaluationStatus | No (Required) | `'DRAFT'` | สถานะแบบประเมิน Draft หรือ Submitted |
| `responsibilityScore` | `tinyint unsigned` | — | Yes (Nullable) | `—` | คะแนนความรับผิดชอบและตรงต่อเวลา |
| `disciplineScore` | `tinyint unsigned` | — | Yes (Nullable) | `—` | คะแนนวินัยและจรรยาบรรณในการทำงาน |
| `communicationScore` | `tinyint unsigned` | — | Yes (Nullable) | `—` | คะแนนการสื่อสารและทำงานร่วมกับผู้อื่น |
| `knowledgeScore` | `tinyint unsigned` | — | Yes (Nullable) | `—` | คะแนนการประยุกต์ใช้ความรู้กับงาน |
| `workQualityScore` | `tinyint unsigned` | — | Yes (Nullable) | `—` | คะแนนคุณภาพและความก้าวหน้าของงาน |
| `problemSolvingScore` | `tinyint unsigned` | — | Yes (Nullable) | `—` | คะแนนการเรียนรู้และแก้ปัญหา |
| `safetyScore` | `tinyint unsigned` | — | Yes (Nullable) | `—` | คะแนนการปฏิบัติตามกฎและความปลอดภัย |
| `strengths` | `longtext` | — | Yes (Nullable) | `—` | จุดแข็งของนักศึกษา |
| `issues` | `longtext` | — | Yes (Nullable) | `—` | ปัญหาหรือประเด็นที่พบ |
| `suggestions` | `longtext` | — | Yes (Nullable) | `—` | ข้อเสนอแนะเพื่อปรับปรุง |
| `nextFollowUp` | `longtext` | — | Yes (Nullable) | `—` | ประเด็นที่ต้องติดตามครั้งถัดไป |
| `submittedAt` | `datetime(3)` | — | Yes (Nullable) | `—` | เวลาส่งรายการเข้าสู่ workflow หรือเวลาส่งแบบประเมิน |
| `createdAt` | `datetime(3)` | — | No (Required) | ``CURRENT_TIMESTAMP(3)`` | เวลาสร้าง row |
| `updatedAt` | `datetime(3)` | — | No (Required) | `—` | เวลาแก้ไข row ล่าสุด |

**Relationships**

- `student_evaluations.appointmentStudentId → supervision_appointment_students.id` — **Many-to-One (N:1)**, `ON DELETE RESTRICT`: ระบุนักศึกษาที่ถูกประเมินใน Appointment
- `student_evaluations.evaluatorLecturerId → users.id` — **Many-to-One (N:1)**, `ON DELETE RESTRICT`: ระบุอาจารย์เจ้าของแบบประเมิน

**หมายเหตุ**

- คะแนน NULL = ยังไม่ตอบ, 0 = N/A, 1..5 = rating; หนึ่งแบบต่อ appointment student ต่อ lecturer; SUBMITTED แล้วห้ามแก้

---

### `company_evaluations`

**ประเภทตาราง:** Transaction  
**หน้าที่ของตาราง:** เก็บแบบประเมินสถานประกอบการหนึ่งชุดต่อ Appointment มีคะแนน 7 หัวข้อ คำแนะนำ ข้อสังเกต และสถานะ Draft/Submitted  
**ส่วนของระบบที่เกี่ยวข้อง:** Post-supervision Company Evaluation

| Attribute | Type | Key / Constraint | Nullable | Default | คำอธิบาย |
|---|---|---|---|---|---|
| `id` | `varchar(30)` | PK | No (Required) | `—` | รหัสหลักของ row |
| `appointmentId` | `varchar(30)` | FK → supervision_appointments.id; Unique | No (Required) | `—` | รหัส Supervision Appointment |
| `evaluatorLecturerId` | `varchar(30)` | FK → users.id | No (Required) | `—` | รหัส User ของอาจารย์ผู้ประเมิน |
| `rubricVersion` | `int` | — | No (Required) | `1` | เลขรุ่นแบบประเมินที่ใช้ เพื่อแปลความหมายคะแนนย้อนหลัง |
| `status` | `EvaluationStatus` | Enum EvaluationStatus | No (Required) | `'DRAFT'` | สถานะแบบประเมิน Draft หรือ Submitted |
| `workRelevanceScore` | `tinyint unsigned` | — | Yes (Nullable) | `—` | คะแนนความสัมพันธ์ของงานกับสาขาวิชา |
| `workChallengeScore` | `tinyint unsigned` | — | Yes (Nullable) | `—` | คะแนนความเหมาะสมของปริมาณและความท้าทายของงาน |
| `supervisorReadinessScore` | `tinyint unsigned` | — | Yes (Nullable) | `—` | คะแนนความพร้อมของผู้ควบคุมงาน |
| `studentSupportScore` | `tinyint unsigned` | — | Yes (Nullable) | `—` | คะแนนการดูแลและติดตามนักศึกษา |
| `environmentSafetyScore` | `tinyint unsigned` | — | Yes (Nullable) | `—` | คะแนนสภาพแวดล้อมและความปลอดภัย |
| `resourceReadinessScore` | `tinyint unsigned` | — | Yes (Nullable) | `—` | คะแนนความพร้อมของอุปกรณ์และทรัพยากร |
| `universityCoordinationScore` | `tinyint unsigned` | — | Yes (Nullable) | `—` | คะแนนการประสานงานกับมหาวิทยาลัย |
| `recommendation` | `CompanyRecommendation` | Enum CompanyRecommendation | Yes (Nullable) | `—` | คำแนะนำว่าจะส่งนักศึกษารุ่นถัดไปหรือไม่ |
| `observations` | `longtext` | — | Yes (Nullable) | `—` | ข้อสังเกตทั่วไปต่อสถานประกอบการ |
| `issues` | `longtext` | — | Yes (Nullable) | `—` | ปัญหาหรือความเสี่ยงที่พบในสถานประกอบการ |
| `suggestions` | `longtext` | — | Yes (Nullable) | `—` | ข้อเสนอแนะต่อสถานประกอบการหรือการประสานงาน |
| `submittedAt` | `datetime(3)` | — | Yes (Nullable) | `—` | เวลาส่งรายการเข้าสู่ workflow หรือเวลาส่งแบบประเมิน |
| `createdAt` | `datetime(3)` | — | No (Required) | ``CURRENT_TIMESTAMP(3)`` | เวลาสร้าง row |
| `updatedAt` | `datetime(3)` | — | No (Required) | `—` | เวลาแก้ไข row ล่าสุด |

**Relationships**

- `company_evaluations.appointmentId → supervision_appointments.id` — **One-to-One (1:1)**, `ON DELETE RESTRICT`: บังคับ Company Evaluation หนึ่งชุดต่อ Appointment
- `company_evaluations.evaluatorLecturerId → users.id` — **Many-to-One (N:1)**, `ON DELETE RESTRICT`: ระบุอาจารย์เจ้าของแบบประเมินสถานประกอบการ

**หมายเหตุ**

- หนึ่ง Appointment มี Company Evaluation หนึ่งชุด; คะแนน NULL/0/1..5 ใช้กติกาเดียวกับ Student Evaluation; SUBMITTED แล้วห้ามแก้

---

### `notifications`

**ประเภทตาราง:** Transaction / Message  
**หน้าที่ของตาราง:** เก็บเนื้อหาการแจ้งเตือนหนึ่งเหตุการณ์และ optional link ไปยังธุรกรรมต้นทาง โดยแยกผู้รับออกเป็น NotificationRecipient เพื่อส่งข้อความเดียวให้หลายคน  
**ส่วนของระบบที่เกี่ยวข้อง:** In-app Notification

| Attribute | Type | Key / Constraint | Nullable | Default | คำอธิบาย |
|---|---|---|---|---|---|
| `id` | `varchar(30)` | PK | No (Required) | `—` | รหัสหลักของ row |
| `type` | `varchar(100)` | — | No (Required) | `—` | รหัสประเภทเหตุการณ์ Notification ที่ service ใช้เลือก template/behavior |
| `severity` | `NotificationSeverity` | Enum NotificationSeverity | No (Required) | `'INFO'` | ระดับความสำคัญสำหรับรูปแบบการแสดงผล |
| `title` | `varchar(255)` | — | No (Required) | `—` | หัวข้อข้อความหรือกิจกรรม |
| `body` | `text` | — | No (Required) | `—` | เนื้อหาการแจ้งเตือน |
| `deepLink` | `varchar(500)` | — | Yes (Nullable) | `—` | internal path ไปหน้าที่เกี่ยวข้อง |
| `placementRequestId` | `varchar(30)` | FK → placement_requests.id | Yes (Nullable) | `—` | รหัส Placement Request ที่ยืนยันแล้วและถูกนัดนิเทศ |
| `letterBatchId` | `varchar(30)` | FK → letter_batches.id | Yes (Nullable) | `—` | รหัส Letter Batch ที่เป็นต้นเหตุของ Notification |
| `appointmentId` | `varchar(30)` | FK → supervision_appointments.id | Yes (Nullable) | `—` | รหัส Supervision Appointment |
| `createdById` | `varchar(30)` | FK → users.id | Yes (Nullable) | `—` | รหัส User หรือ service actor ผู้สร้าง Notification; ว่างได้สำหรับเหตุการณ์ระบบ |
| `createdAt` | `datetime(3)` | — | No (Required) | ``CURRENT_TIMESTAMP(3)`` | เวลาสร้าง row |

**Relationships**

- `notifications.placementRequestId → placement_requests.id` — **Many-to-One (N:1)**, `ON DELETE SET NULL`: เชื่อมข้อความกับคำร้องเพื่อเปิดรายละเอียดและติดตามต้นเหตุ
- `notifications.letterBatchId → letter_batches.id` — **Many-to-One (N:1)**, `ON DELETE SET NULL`: เชื่อมข้อความกับชุดหนังสือ
- `notifications.appointmentId → supervision_appointments.id` — **Many-to-One (N:1)**, `ON DELETE SET NULL`: เชื่อมข้อความกับ Appointment
- `notifications.createdById → users.id` — **Many-to-One (N:1)**, `ON DELETE SET NULL`: ระบุผู้สร้างข้อความเมื่อเป็น user action
- `notification_recipients.notificationId → notifications.id` — **One-to-Many (1:N)**, `ON DELETE CASCADE`: ระบุข้อความที่ส่งให้ผู้รับ

**หมายเหตุ**

- type ใช้ event type ที่ service กำหนด; deepLink ต้องเป็น internal path; FK ธุรกรรมเป็น Nullable เพื่อรองรับข้อความทั่วไปและ SET NULL

---

### `notification_recipients`

**ประเภทตาราง:** Junction / Delivery State  
**หน้าที่ของตาราง:** เชื่อม Notification กับ User แต่ละผู้รับ พร้อมเวลาส่งและเวลาอ่าน  
**ส่วนของระบบที่เกี่ยวข้อง:** Notification delivery, unread count และ mark-as-read

| Attribute | Type | Key / Constraint | Nullable | Default | คำอธิบาย |
|---|---|---|---|---|---|
| `id` | `varchar(30)` | PK | No (Required) | `—` | รหัสหลักของ row |
| `notificationId` | `varchar(30)` | FK → notifications.id; Composite Unique (notificationId, accountId) | No (Required) | `—` | รหัส Notification |
| `accountId` | `varchar(30)` | FK → users.id; Composite Unique (notificationId, accountId) | No (Required) | `—` | รหัส User ผู้รับ Notification |
| `deliveredAt` | `datetime(3)` | — | No (Required) | ``CURRENT_TIMESTAMP(3)`` | เวลาที่สร้างการส่งให้ผู้รับ |
| `readAt` | `datetime(3)` | — | Yes (Nullable) | `—` | เวลาที่ผู้รับอ่าน; ว่างหมายถึงยังไม่อ่าน |

**Relationships**

- `notification_recipients.notificationId → notifications.id` — **Many-to-One (N:1)**, `ON DELETE CASCADE`: ระบุข้อความที่ส่งให้ผู้รับ
- `notification_recipients.accountId → users.id` — **Many-to-One (N:1)**, `ON DELETE CASCADE`: ระบุ User ผู้รับและเก็บ read state แยกรายคน

**หมายเหตุ**

- ผู้รับซ้ำใน Notification เดียวกันไม่ได้; Cascade delete เมื่อลบ Notification หรือ User

---

### `calendar_events`

**ประเภทตาราง:** Transaction / User-owned  
**หน้าที่ของตาราง:** เก็บกิจกรรมปฏิทินที่ผู้ใช้สร้างเอง; กิจกรรมระบบ เช่น Appointment และ deadline อ่านจากตารางต้นทางและไม่บันทึกซ้ำ  
**ส่วนของระบบที่เกี่ยวข้อง:** Role Calendar และ Personal Event

| Attribute | Type | Key / Constraint | Nullable | Default | คำอธิบาย |
|---|---|---|---|---|---|
| `id` | `varchar(30)` | PK | No (Required) | `—` | รหัสหลักของ row |
| `eventType` | `CalendarEventType` | Enum CalendarEventType | No (Required) | `—` | ประเภทกิจกรรมปฏิทิน |
| `title` | `varchar(255)` | — | No (Required) | `—` | หัวข้อข้อความหรือกิจกรรม |
| `description` | `text` | — | Yes (Nullable) | `—` | รายละเอียดกิจกรรม |
| `startsAt` | `datetime(3)` | — | No (Required) | `—` | วันเวลาที่กิจกรรมเริ่ม |
| `endsAt` | `datetime(3)` | — | Yes (Nullable) | `—` | วันเวลาที่กิจกรรมสิ้นสุด |
| `isAllDay` | `boolean` | — | No (Required) | `false` | ระบุว่าเป็นกิจกรรมทั้งวัน |
| `ownerAccountId` | `varchar(30)` | FK → users.id | No (Required) | `—` | รหัส User เจ้าของกิจกรรม |
| `createdAt` | `datetime(3)` | — | No (Required) | ``CURRENT_TIMESTAMP(3)`` | เวลาที่ผู้ใช้สร้างกิจกรรมส่วนตัว |
| `updatedAt` | `datetime(3)` | — | No (Required) | `—` | เวลาแก้ไข row ล่าสุด |

**Relationships**

- `calendar_events.ownerAccountId → users.id` — **Many-to-One (N:1)**, `ON DELETE CASCADE`: กำหนด ownership เพื่อให้ผู้ใช้เห็นและจัดการเฉพาะกิจกรรมของตน

**หมายเหตุ**

- หนึ่ง event มี owner คนเดียว; endsAt เป็น Nullable; owner ลบแล้ว event ถูก Cascade delete

## Relationship Catalog

| # | Foreign Key / Child | Referenced Key / Parent | Cardinality | ON DELETE | จุดประสงค์ |
|---:|---|---|---|---|---|
| 1 | `users.createdById` | `users.id` | 1:N | `SET NULL` | เก็บว่า User ใดสร้างบัญชีนี้ โดยคงบัญชีที่สร้างไว้เมื่อผู้สร้างถูกลบ |
| 2 | `audit_logs.actorAccountId` | `users.id` | 1:N | `SET NULL` | เชื่อม audit กับผู้กระทำเมื่อระบุตัวตนได้ |
| 3 | `coop_cycle_status_history.cycleId` | `coop_cycles.id` | 1:N | `RESTRICT` | จัด timeline ให้รอบสหกิจที่ถูกเปลี่ยนสถานะ |
| 4 | `coop_cycle_status_history.changedById` | `users.id` | 1:N | `RESTRICT` | ระบุผู้ดำเนินการเปลี่ยนสถานะรอบ |
| 5 | `cycle_enrollments.cycleId` | `coop_cycles.id` | 1:N | `RESTRICT` | ระบุรอบที่นักศึกษาเข้าร่วม |
| 6 | `cycle_enrollments.studentId` | `users.id` | 1:N | `RESTRICT` | ระบุนักศึกษาของ enrollment |
| 7 | `cycle_enrollments.createdById` | `users.id` | 1:N | `RESTRICT` | ระบุเจ้าหน้าที่/ผู้สร้าง enrollment |
| 8 | `companies.createdById` | `users.id` | 1:N | `RESTRICT` | ระบุผู้สร้าง Company master data |
| 9 | `company_sites.companyId` | `companies.id` | 1:N | `RESTRICT` | จัดสาขาทั้งหมดให้อยู่ภายใต้ Company เดียว |
| 10 | `company_sites.provinceId` | `provinces.id` | 1:N | `RESTRICT` | อ่านจังหวัดและภูมิภาคของสาขาจากทะเบียนกลาง |
| 11 | `student_applications.enrollmentId` | `cycle_enrollments.id` | 1:N | `RESTRICT` | กำหนด ownership และรอบของ tracker นักศึกษา |
| 12 | `student_applications.companySiteId` | `company_sites.id` | 1:N | `SET NULL` | เชื่อม tracker กับสาขาในทะเบียนเมื่อมีข้อมูลตรงกัน; SET NULL เพื่อรักษา snapshot |
| 13 | `placement_requests.enrollmentId` | `cycle_enrollments.id` | 1:N | `RESTRICT` | ผูกคำร้องกับนักศึกษาและรอบสหกิจ |
| 14 | `placement_requests.companySiteId` | `company_sites.id` | 1:N | `RESTRICT` | ระบุสาขาที่ขอไปฝึก |
| 15 | `placement_requests.confirmedById` | `users.id` | 1:N | `SET NULL` | ระบุอาจารย์ผู้ยืนยันผลรายบุคคล |
| 16 | `placement_request_status_history.requestId` | `placement_requests.id` | 1:N | `RESTRICT` | จัด timeline ให้คำร้องต้นทาง |
| 17 | `placement_request_status_history.changedById` | `users.id` | 1:N | `RESTRICT` | ระบุผู้ทำ status transition |
| 18 | `letter_batches.cycleId` | `coop_cycles.id` | 1:N | `RESTRICT` | กำหนดรอบของชุดหนังสือ |
| 19 | `letter_batches.companySiteId` | `company_sites.id` | 1:N | `RESTRICT` | กำหนดสาขาปลายทางร่วมของชุดหนังสือ |
| 20 | `letter_batches.createdById` | `users.id` | 1:N | `RESTRICT` | ระบุอาจารย์ผู้สร้างชุด |
| 21 | `letter_batches.issuedById` | `users.id` | 1:N | `SET NULL` | ระบุอาจารย์ผู้ออก/เผยแพร่หนังสือ |
| 22 | `letter_batch_members.batchId` | `letter_batches.id` | 1:N | `RESTRICT` | ระบุชุดที่ membership อยู่ |
| 23 | `letter_batch_members.requestId` | `placement_requests.id` | 1:N | `RESTRICT` | ระบุคำร้องที่ถูกนำเข้าชุด |
| 24 | `letter_document_versions.batchId` | `letter_batches.id` | 1:N | `RESTRICT` | จัด version เอกสารให้อยู่ภายใต้ชุดหนังสือ |
| 25 | `letter_document_versions.uploadedById` | `users.id` | 1:N | `RESTRICT` | ระบุผู้รับผิดชอบการอัปโหลดไฟล์ |
| 26 | `letter_document_versions.reviewedById` | `users.id` | 1:N | `SET NULL` | ระบุผู้ตรวจเอกสารเมื่อมีการ review |
| 27 | `supervision_groups.cycleId` | `coop_cycles.id` | 1:N | `RESTRICT` | กำหนดรอบของกลุ่มนิเทศ |
| 28 | `supervision_groups.createdById` | `users.id` | 1:N | `RESTRICT` | ระบุ Staff ผู้สร้างกลุ่ม |
| 29 | `supervision_group_lecturers.groupId,cycleId,round` | `supervision_groups.id,cycleId,round` | 1:N | `RESTRICT` | ผูกอาจารย์กับกลุ่มเดียวกันอย่างสอดคล้องทั้ง id, cycle และ round |
| 30 | `supervision_group_lecturers.lecturerId` | `users.id` | 1:N | `RESTRICT` | ระบุ User role LECTURER ที่เป็นสมาชิกกลุ่ม |
| 31 | `supervision_group_companies.groupId,cycleId,round` | `supervision_groups.id,cycleId,round` | 1:N | `RESTRICT` | ผูก Company Site assignment กับกลุ่มใน cycle/round เดียวกัน |
| 32 | `supervision_group_companies.companySiteId` | `company_sites.id` | 1:N | `RESTRICT` | ระบุสาขาที่กลุ่มรับผิดชอบ |
| 33 | `supervision_appointments.groupCompanyId` | `supervision_group_companies.id` | 1:N | `RESTRICT` | สร้างนัดภายใต้ assignment ของกลุ่มต่อสาขา |
| 34 | `supervision_appointments.createdById` | `users.id` | 1:N | `RESTRICT` | ระบุผู้สร้าง Appointment |
| 35 | `supervision_appointments.publishedById` | `users.id` | 1:N | `SET NULL` | ระบุผู้เผยแพร่ Appointment |
| 36 | `supervision_appointments.resultRecordedById` | `users.id` | 1:N | `SET NULL` | ระบุอาจารย์ผู้บันทึกผลร่วม |
| 37 | `supervision_appointment_lecturers.appointmentId` | `supervision_appointments.id` | 1:N | `RESTRICT` | จัดผู้เข้าร่วมให้อยู่ใน Appointment |
| 38 | `supervision_appointment_lecturers.lecturerId` | `users.id` | 1:N | `RESTRICT` | ระบุอาจารย์ตามแผน/ผู้เข้าร่วมจริง |
| 39 | `supervision_appointment_students.appointmentId` | `supervision_appointments.id` | 1:N | `RESTRICT` | จัดนักศึกษาให้อยู่ใน Appointment |
| 40 | `supervision_appointment_students.placementRequestId` | `placement_requests.id` | 1:N | `RESTRICT` | อ้าง confirmed placement เป็น source of truth ของนักศึกษาและสาขา |
| 41 | `student_evaluations.appointmentStudentId` | `supervision_appointment_students.id` | 1:N | `RESTRICT` | ระบุนักศึกษาที่ถูกประเมินใน Appointment |
| 42 | `student_evaluations.evaluatorLecturerId` | `users.id` | 1:N | `RESTRICT` | ระบุอาจารย์เจ้าของแบบประเมิน |
| 43 | `company_evaluations.appointmentId` | `supervision_appointments.id` | 1:1 | `RESTRICT` | บังคับ Company Evaluation หนึ่งชุดต่อ Appointment |
| 44 | `company_evaluations.evaluatorLecturerId` | `users.id` | 1:N | `RESTRICT` | ระบุอาจารย์เจ้าของแบบประเมินสถานประกอบการ |
| 45 | `notifications.placementRequestId` | `placement_requests.id` | 1:N | `SET NULL` | เชื่อมข้อความกับคำร้องเพื่อเปิดรายละเอียดและติดตามต้นเหตุ |
| 46 | `notifications.letterBatchId` | `letter_batches.id` | 1:N | `SET NULL` | เชื่อมข้อความกับชุดหนังสือ |
| 47 | `notifications.appointmentId` | `supervision_appointments.id` | 1:N | `SET NULL` | เชื่อมข้อความกับ Appointment |
| 48 | `notifications.createdById` | `users.id` | 1:N | `SET NULL` | ระบุผู้สร้างข้อความเมื่อเป็น user action |
| 49 | `notification_recipients.notificationId` | `notifications.id` | 1:N | `CASCADE` | ระบุข้อความที่ส่งให้ผู้รับ |
| 50 | `notification_recipients.accountId` | `users.id` | 1:N | `CASCADE` | ระบุ User ผู้รับและเก็บ read state แยกรายคน |
| 51 | `calendar_events.ownerAccountId` | `users.id` | 1:N | `CASCADE` | กำหนด ownership เพื่อให้ผู้ใช้เห็นและจัดการเฉพาะกิจกรรมของตน |

## Junction / Mapping Table และ N:M

| Junction Table | เชื่อม Entity | เหตุผลที่มีตารางกลาง |
|---|---|---|
| `letter_batch_members` | letter_batches ↔ placement_requests | รองรับ N:M เชิงประวัติ พร้อม snapshot และ active membership guard |
| `supervision_group_lecturers` | supervision_groups ↔ users (Lecturer) | มอบหมายอาจารย์หลายคนต่อกลุ่มและอาจารย์มีหลายกลุ่มต่าง cycle/round |
| `supervision_group_companies` | supervision_groups ↔ company_sites | มอบหมายหลายสาขาต่อกลุ่มและสาขามีกลุ่มต่าง cycle/round |
| `supervision_appointment_lecturers` | supervision_appointments ↔ users (Lecturer) | เก็บ planned/actual participants และบทบาท |
| `supervision_appointment_students` | supervision_appointments ↔ placement_requests | ให้นัดมีนักศึกษาหลายคนและ confirmed request ปรากฏในนัดตามรอบนิเทศ |
| `notification_recipients` | notifications ↔ users | ส่งข้อความเดียวให้หลายผู้รับและเก็บ read state รายคน |

> Foreign Key แต่ละขาของ Junction เป็น N:1; เมื่อนำสองขารวมกันจึงสร้างความสัมพันธ์ N:M ระหว่าง Entity ปลายทาง โดย Unique Constraint จำกัดการซ้ำตาม business rule

## การจัดประเภท Table

- **Lookup / Master Data:** `provinces`, `users`, `companies`, `company_sites`, `coop_cycles`
- **Core Transaction:** `cycle_enrollments`, `student_applications`, `placement_requests`, `letter_batches`, `letter_document_versions`, `supervision_groups`, `supervision_appointments`, `student_evaluations`, `company_evaluations`, `notifications`, `calendar_events`
- **Junction / Mapping:** `letter_batch_members`, `supervision_group_lecturers`, `supervision_group_companies`, `supervision_appointment_lecturers`, `supervision_appointment_students`, `notification_recipients`
- **History / Log:** `audit_logs`, `coop_cycle_status_history`, `placement_request_status_history`

## Constraint และ Business Rule สำคัญ

- FK ที่ลงท้ายด้วย `studentId`/`lecturerId` บังคับได้เพียงว่าเป็น `users.id`; service ต้องตรวจ role ให้ถูกต้อง
- Nullable Unique Slot ใช้ใน `currentStudentKey`, `activeSlotKey`, `confirmedSlotKey`, `activeMembershipKey` เพื่อบังคับ uniqueness เฉพาะ row ที่ active
- Composite FK ของ supervision mapping ยืนยันว่า `groupId`, `cycleId`, `round` เป็นกลุ่มเดียวกัน
- Snapshot columns ใน enrollment/letter เก็บค่าประวัติและไม่ควรถูก sync ย้อนหลังจาก Master Data
- Score columns ยอมรับ `NULL`, 0 และ 1..5; DB type อย่างเดียวไม่บังคับ upper bound จึงต้อง validate ที่ Zod/service
- การแก้หลายตารางใน status transition, batching, confirmation และ completion ต้องทำผ่าน transaction

## ส่วนที่ยังไม่สามารถยืนยันจากโค้ดปัจจุบัน

ไม่พบ Table, Column หรือ Relationship ที่ต้องเดาความหมาย: ทุกคำอธิบายยืนยันได้จาก schema, migration, feature rules/service, seed หรือเอกสาร requirement/database design ที่อยู่ในโปรเจกต์ อย่างไรก็ตาม feature backend บางส่วนยังอยู่ในแผนพัฒนา จึงเป็นการยืนยัน semantics/contract ไม่ใช่การยืนยันว่า persistence flow ถูก implement ครบแล้ว
