# AGENTS.md — Cowier Co-op Supervision System

แนวทางการทำงานสำหรับ Coding Agents ในโปรเจกต์ **ระบบบริหารจัดการและนิเทศงานสหกิจศึกษา (Cooperative Education Management & Supervision System)**

---

## 1. ภาพรวมโปรเจกต์และขอบเขตการทำงาน (Project & Domain Scope)

ระบบนี้ใช้สำหรับบริหารจัดการและติดตามการฝึกงานสหกิจศึกษาของนักศึกษา ตั้งแต่การเลือกสถานประกอบการ การจัดสรรอาจารย์นิเทศ การวางแผนตารางนิเทศ การบันทึกผลและประเมินผล ไปจนถึงการคำนวณค่าใช้จ่ายในการนิเทศ

ขอบเขตการทำงานแบ่งตาม 3 บทบาทหลัก (อ้างอิง [`dosc/requirement.md`](./dosc/requirement.md)):

### 1. ส่วนสำหรับเจ้าหน้าที่ (Admin / Staff)
- **จัดการข้อมูล Master Data:** เพิ่ม ลบ แก้ไข และสืบค้นข้อมูลนักศึกษา อาจารย์ และสถานประกอบการ
- **นำเข้าและส่งออกข้อมูล:** นำเข้าและส่งออกข้อมูลนักศึกษาด้วยไฟล์ CSV หรือ Excel (`.xlsx`) พร้อมระบบตรวจสอบความถูกต้อง
- **จัดการรอบสหกิจศึกษา:** จัดการข้อมูลปีการศึกษา ภาคเรียน และสถานะรอบสหกิจ
- **จัดสรรพื้นที่และความรับผิดชอบ:** กำหนดพื้นที่รับผิดชอบให้อาจารย์ตามภูมิภาค จังหวัด หรือสถานประกอบการ
- **วางแผนและจัดตารางนิเทศ:** คัดกรองนักศึกษาเพื่อสร้างและแก้ไขตารางนิเทศ (แบ่งเป็นการนิเทศครั้งที่ 1 และครั้งที่ 2) กำหนดวัน เวลา สถานประกอบการ นักศึกษา และอาจารย์ผู้รับผิดชอบ
- **ตรวจสอบตารางซ้ำซ้อน (Conflict Detection):** ตรวจสอบตารางเวลาที่ซ้ำหรือชนกันของอาจารย์ นักศึกษา และสถานประกอบการ
- **คำนวณค่าใช้จ่าย:** บันทึกค่าเดินทาง ค่าที่พัก ค่าเบี้ยเลี้ยง/อาหาร และคำนวณยอดรวมค่าใช้จ่ายในการนิเทศ

### 2. ส่วนสำหรับอาจารย์นิเทศ (Lecturer / Supervisor)
- **เข้าสู่ระบบ / ยืนยันตัวตน:** เข้าสู่ระบบและออกจากระบบ
- **ดูตารางนิเทศ:** ดูตารางนิเทศที่ตนเองได้รับมอบหมาย แยกตามครั้งที่ 1 และครั้งที่ 2
- **ดูข้อมูลนักศึกษาและสถานประกอบการ:** ค้นหาและดูรายละเอียดนักศึกษาและสถานประกอบการที่ได้รับมอบหมาย
- **อัปเดตสถานะการนิเทศ:** บันทึกสถานะ (เช่น จัดตารางแล้ว, นิเทศเสร็จแล้ว, เลื่อน, ยกเลิก)
- **บันทึกผลและข้อเสนอแนะ:** บันทึกผลการนิเทศและข้อเสนอแนะของนักศึกษา
- **ประเมินผล:** ประเมินนักศึกษาและประเมินสถานประกอบการหลังการนิเทศแต่ละครั้ง

### 3. ส่วนสำหรับนักศึกษา (Student)
- **เข้าสู่ระบบ / ยืนยันตัวตน:** เข้าสู่ระบบและออกจากระบบ
- **ค้นหาและเลือกสถานประกอบการ:** ค้นหา ดูข้อมูล และเลือก/บันทึกสถานประกอบการที่ต้องการไปปฏิบัติงานสหกิจศึกษา
- **ตรวจสอบผลการยืนยัน:** ดูสถานประกอบการที่ได้รับการยืนยันเป็นสถานที่ฝึกงานของตนเอง
- **ดูตารางนิเทศ:** ดูตารางนิเทศของตนเอง (ครั้งที่นิเทศ วันที่ เวลา สถานประกอบการ และอาจารย์นิเทศ)

---

## 2. สถาปัตยกรรมและเทคโนโลยี (Tech Stack & Architecture)

| Layer / Domain | Technology | รายละเอียดและแนวปฏิบัติ |
|---|---|---|
| **App Framework** | **Nuxt** (Vue 3 + Nitro) | ใช้ Composition API `<script setup lang="ts">` และ TypeScript แบบเข้มงวด |
| **Styling & UI** | **Tailwind CSS** (ไม่ใช้ `@nuxt/ui`) | พัฒนา UI Components ด้วย Tailwind CSS โดยตรง ไม่ใช้ component library สำเร็จรูป เพื่อความยืดหยุ่นและคุมดีไซน์ได้เต็มที่ |
| **Icons** | **Lucide Icons** | ใช้ icon จากชุดเดียวกันทั้งโปรเจกต์ ไม่ผสมหลาย icon sets และไม่ใช้ emoji แทน functional icon |
| **LINE Ecosystem** | **LINE Messaging API / LIFF / Beacon** | รองรับ Webhook (HMAC signature, Idempotency), LIFF + LINE Login (ID Token verify ผ่าน JWKS), และ LINE Beacon (BLE check-in) |
| **DevOps & Deploy** | **Docker & Docker Compose** | Multi-stage build, non-root user, healthcheck, แยก runtime config ออกจาก build-time |

---

## 3. กฎและมาตรฐานการพัฒนา (Engineering Standards)

### A. Frontend & UI (Nuxt + Tailwind CSS)
1. **Separation of Concerns:**
   - Business/Data Logic ให้แยกไว้ใน Composables (`composables/use*.ts`)
   - Presentational Components รับ props และ emit events
2. **Mandatory 4-State UI:** ทุก View/Component ที่มีการดึงข้อมูล ต้องจัดการ 4 สถานะให้ครบถ้วน:
   - **Loading State:** แสดง Skeleton loader ที่รูปทรงสอดคล้องกับ Layout จริง (หลีกเลี่ยง spinner เต็มจอ)
   - **Empty State:** กล่องข้อความแจ้งเตือนพร้อม icon และปุ่ม Action เมื่อไม่มีข้อมูล
   - **Error State:** การแจ้งเตือนข้อผิดพลาดที่ชัดเจน พร้อมปุ่ม Retry เพื่อดึงข้อมูลใหม่
   - **Data State:** แสดงผลข้อมูลจริง พร้อม responsive layout (Mobile Card / Desktop Table)
3. **Forms & Actions:**
   - แสดง inline validation error ให้ตรงกับ field/section ที่ผิดพลาด
   - มี Loading state และป้องกัน double submission บนปุ่ม Action
   - การกระทำที่เป็น destructive (เช่น ลบข้อมูล) ต้องมีกลไกยืนยัน (Confirmation)
   - ใช้ feedback component ของโปรเจกต์ (Toast / Modal) ไม่ใช้ browser `alert()` หรือ `confirm()`

### B. Backend, API & Security
1. **Role-Based Access Control (RBAC):** ตรวจสอบสิทธิ์ที่ Backend ทุก Endpoint อย่างเข้มงวดตาม 3 บทบาท (Admin, Lecturer, Student)
2. **LINE Webhook Integrity:**
   - ต้องตรวจสอบ `x-line-signature` (HMAC-SHA256 บน raw body) เสมอ หากไม่ตรงให้ปฏิเสธด้วย 401 ทันที
   - ตอบกลับ 2xx ให้เร็วที่สุด
   - รองรับ Idempotency โดยบันทึก `webhookEventId` ป้องกันการประมวลผล event ซ้ำ
3. **Authentication & Token Verification:**
   - การยืนยันตัวตนผ่าน LIFF / LINE Login ต้องส่ง ID Token ไป verify กับ LINE JWKS ที่ Backend (audience = Channel ID, algorithm = ES256)
4. **Data Validation:** ตรวจสอบความถูกต้องของข้อมูล (Schema Validation เช่น Zod หรือ Standard Schema) ก่อนบันทึกเสมอ

---

## 4. คู่มือการเรียกใช้ Skills เฉพาะทาง (.agents/skills/)

เมื่อทำงานในแต่ละด้าน ให้ศึกษาและปฏิบัติตามคำแนะนำใน skill ที่เกี่ยวข้อง:

| งานที่ทำ | Skill ที่ต้องใช้งาน | เอกสารอ้างอิง |
|---|---|---|
| **สร้าง/แก้ไข Nuxt UI, Components, Forms, Tables ด้วย Tailwind CSS** | `web-ui-coding-standards` | [`.agents/skills/web-ui-coding-standards/SKILL.md`](./.agents/skills/web-ui-coding-standards/SKILL.md)<br>- [App Shells](./.agents/skills/web-ui-coding-standards/references/app-shells.md)<br>- [Data Tables](./.agents/skills/web-ui-coding-standards/references/data-tables.md) |
| **พัฒนา LINE Bot, Webhook, LIFF, LINE Login, LINE Beacon** | `line-beacon-development` | [`.agents/skills/line-beacon-development/SKILL.md`](./.agents/skills/line-beacon-development/SKILL.md)<br>- [Webhook Signature](./.agents/skills/line-beacon-development/references/webhook-signature.md)<br>- [LIFF & LINE Login](./.agents/skills/line-beacon-development/references/liff-line-login.md) |
| **สร้าง/แก้ไข Dockerfile, Docker Compose, Deployment config** | `docker-deployment-standards` | [`.agents/skills/docker-deployment-standards/SKILL.md`](./.agents/skills/docker-deployment-standards/SKILL.md) |
| **ตรวจสอบคุณภาพโค้ด, PR, แผนงาน หรือ Architecture Review** | `scrutinize` | [`.agents/skills/scrutinize/SKILL.md`](./.agents/skills/scrutinize/SKILL.md) |
| **สรุปสถานะและส่งต่องานให้อีก Agent** | `handoff` | [`.agents/skills/handoff/SKILL.md`](./.agents/skills/handoff/SKILL.md) |

---

## 5. หลักการทำงานพื้นฐานของ Agent (Core Operating Principles)

1. **Understand Before Acting (เข้าใจก่อนลงมือ):**
   - อ่านโค้ดและเอกสารที่เกี่ยวข้อง (`dosc/requirement.md`, `AGENTS.md`, Skills) ก่อนแก้ไขเสมอ
   - หากความต้องการไม่ชัดเจนและส่งผลต่อสถาปัตยกรรมอย่างมีนัยสำคัญ ให้สอบถามก่อน
2. **Respect Scope and Authority (เคารพขอบเขตของงาน):**
   - ดำเนินการเฉพาะสิ่งที่ได้รับมอบหมาย ไม่แก้ไขหรือ refactor โค้ดนอกขอบเขตโดยไม่จำเป็น
3. **Keep the Solution Simple (เรียบง่ายและตรงจุด):**
   - เลือกใช้วิธีการที่เรียบง่ายที่สุดที่แก้ปัญหาได้อย่างสมบูรณ์ ไม่เพิ่ม abstraction ที่ใช้งานเพียงครั้งเดียว
4. **Make Surgical Changes (แก้ไขอย่างแม่นยำ):**
   - ทุกบรรทัดที่เปลี่ยนแปลงต้องสืบย้อนไปยังเป้าหมายของงานได้ รักษา format และ style ของโค้ดเดิม
5. **Work Toward Verifiable Outcomes (ตรวจสอบผลลัพธ์ได้จริง):**
   - วางแผนขั้นตอนการทดสอบและรันคำสั่งตรวจสอบ (TypeCheck, Lint, Build, Test) ก่อนส่งมอบงานเสมอ

