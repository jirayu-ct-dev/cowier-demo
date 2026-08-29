# AGENTS.md — CWIE BRU Co-op Supervision System

แนวทางการทำงานสำหรับ Coding Agents ในโปรเจกต์ **ระบบบริหารจัดการและนิเทศงานสหกิจศึกษา (Cooperative Education Management & Supervision System)**

---

## 1. ภาพรวมโปรเจกต์และขอบเขตการทำงาน (Project & Domain Scope)

ระบบนี้ใช้สำหรับบริหารจัดการและติดตามการฝึกงานสหกิจศึกษาของนักศึกษา ตั้งแต่การเลือกสถานประกอบการ การจัดสรรอาจารย์นิเทศ การวางแผนตารางนิเทศ การบันทึกผลและประเมินผล ไปจนถึงการคำนวณค่าใช้จ่ายในการนิเทศ

ขอบเขตการทำงานแบ่งตาม 3 บทบาทหลัก (อ้างอิง [`dosc/requirement.md`](./dosc/requirement.md)):

### 1. ส่วนสำหรับเจ้าหน้าที่ (Admin / Staff)
- **จัดการผู้ใช้และข้อมูลบุคคล:** เพิ่ม แก้ไข สืบค้น ระงับ และยุติการใช้งานข้อมูลนักศึกษา อาจารย์ และบัญชีผู้ใช้
- **นำเข้าและส่งออกข้อมูล:** นำเข้าและส่งออกข้อมูลนักศึกษาด้วยไฟล์ CSV หรือ Excel (`.xlsx`) พร้อมระบบตรวจสอบความถูกต้อง
- **จัดกลุ่มอาจารย์นิเทศ:** สร้างกลุ่มและกำหนดอาจารย์ผู้รับผิดชอบสำหรับการนิเทศ

### 2. ส่วนสำหรับอาจารย์นิเทศ (Lecturer / Supervisor)
- **เข้าสู่ระบบ / ยืนยันตัวตน:** เข้าสู่ระบบและออกจากระบบ
- **ตรวจคำร้อง:** อาจารย์ทุกคนตรวจ ยืนยัน หรือส่งกลับคำร้องของนักศึกษาให้แก้ไขได้
- **ออกหนังสือ:** รวมคำร้องที่เข้ากันได้ จัดทำและเผยแพร่หนังสือขอฝึกงาน รวมถึงตรวจหนังสือตอบกลับและยืนยันผลรายบุคคล
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
| **App Framework** | **Nuxt 4** (Vue 3 + Nitro Engine) | ใช้ Composition API `<script setup lang="ts">` และ TypeScript แบบเข้มงวด |
| **Styling & UI** | **Tailwind CSS + Reka UI** | ใช้ Tailwind CSS สำหรับ Styling และ Reka UI สำหรับ Headless Accessible Primitives (ไม่ใช้ `@nuxt/ui`) |
| **Icons** | **Lucide Icons** (`@lucide/vue`) | ใช้ icon จากชุดเดียวกันทั้งโปรเจกต์ ไม่ผสมหลาย icon sets และไม่ใช้ emoji แทน functional icon |
| **Date & Time** | **date-fns** | จัดการวันเวลา ปฏิทินรอบสหกิจ และตารางนิเทศ |
| **Validation** | **Zod** | Schema validation สำหรับ Form inputs, API payloads, และ Data import validation |
| **Database & ORM** | **Prisma ORM + MySQL 8.4 LTS** | Data modeling, migrations, และ Type-safe database queries โดยเริ่มเชื่อมต่อเมื่อเข้าสู่ระยะ Backend |
| **Authentication** | **Nuxt Auth / Session Auth** | Session-based authentication พร้อม Role-Based Access Control (Admin, Lecturer, Student) |
| **Files & Data** | **Excel & CSV Utilities** | นำเข้า/ส่งออกข้อมูลนักศึกษาและรายงานผลการนิเทศ |
| **DevOps & Deploy** | **Docker & Docker Compose** | Multi-stage build, non-root user, healthcheck, แยก runtime config ออกจาก build-time |

---

## 3. กฎและมาตรฐานการพัฒนา (Engineering Standards)

### A. Frontend & UI (Nuxt + Tailwind CSS + Reka UI)
0. **Design System เป็นแหล่งอ้างอิงหลัก (Single Source of Truth):**
   - หน้า [`/dev/ui`](./app/pages/dev/ui.vue) คือมาตรฐาน UI กลางของระบบ ทุกหน้าต้องยึดรูปแบบสี, typography, spacing, ขนาด control, card, form, modal, badge, state และ interaction จากหน้านี้
   - ก่อนสร้างหรือแก้ UI ให้ตรวจองค์ประกอบที่มีใน `/dev/ui` และ reuse shared component กับ pattern เดิมก่อน ห้ามสร้างรูปแบบหน้าตาหรือ interaction ใหม่ที่ขัดกับ Design System หากจำเป็นต้องมี pattern ใหม่ ให้เพิ่มตัวอย่างใน `/dev/ui` เพื่อให้ตรวจสอบก่อนนำไปใช้ในหน้าจริง
   - Data table ทุกหน้าต้องยึดโครงเดียวกับส่วน **Data Table** ใน `/dev/ui`: ลำดับหัวข้อและ primary action, search, filter ฝั่งขวา, ปุ่ม reset แบบ icon-only, active-filter chips, sortable header, row actions, loading/empty/error/data state, mobile card และ footer แบ่งหน้า
   - เพิ่ม checkbox, bulk action, column, filter หรือ row action เฉพาะเมื่อ flow ของหน้านั้นต้องใช้จริง โดยยังคงรูปแบบการแสดงผลและ interaction ตาม `/dev/ui`
   - ใช้ design token และ shared UI component ที่มีอยู่ ห้าม hard-code สีหรือสร้าง component ซ้ำเมื่อ Design System มีองค์ประกอบนั้นอยู่แล้ว
1. **Separation of Concerns:**
   - Business/Data Logic ให้แยกไว้ใน Composables (`composables/use*.ts`)
   - Presentational Components รับ props และ emit events
   - ใช้ Reka UI primitives สำหรับ Dialog, DropdownMenu, Tabs, Popover เพื่อให้ได้ Accessibility ครบถ้วน โดยแต่งสไตล์ด้วย Tailwind CSS
2. **Mandatory 4-State UI:** ทุก View/Component ที่มีการดึงข้อมูล ต้องจัดการ 4 สถานะให้ครบถ้วน:
   - **Loading State:** แสดง Skeleton loader ที่รูปทรงสอดคล้องกับ Layout จริง (หลีกเลี่ยง spinner เต็มจอ)
   - **Empty State:** กล่องข้อความแจ้งเตือนพร้อม icon และปุ่ม Action เมื่อไม่มีข้อมูล
   - **Error State:** การแจ้งเตือนข้อผิดพลาดที่ชัดเจน พร้อมปุ่ม Retry เพื่อดึงข้อมูลใหม่
   - **Data State:** แสดงผลข้อมูลจริง พร้อม responsive layout (Mobile Card / Desktop Table)
3. **Forms & Actions:**
   - ใช้ Zod Schema ในการ validate form ก่อน submit
   - แสดง inline validation error ให้ตรงกับ field/section ที่ผิดพลาด
   - มี Loading state และป้องกัน double submission บนปุ่ม Action
   - การกระทำที่เป็น destructive (เช่น ลบข้อมูล) ต้องมีกลไกยืนยัน (Confirmation)
   - ใช้ feedback component ของโปรเจกต์ (Toast / Modal) ไม่ใช้ browser `alert()` หรือ `confirm()`

### B. Backend, Database & Security
1. **Role-Based Access Control (RBAC):** ตรวจสอบสิทธิ์ที่ Backend ทุก Nitro Endpoint อย่างเข้มงวดตาม 3 บทบาท (Admin, Lecturer, Student)
2. **Prisma & Database Safety:**
   - ป้องกัน N+1 query: ใช้ `select` หรือ bounded `include` ที่เฉพาะเจาะจงเสมอ
   - จัดการ Multi-table transaction ผ่าน `prisma.$transaction()` เมื่อมีการแก้ไขหลายตารางพร้อมกัน
   - ปฏิบัติตาม Migration workflow อย่างเคร่งครัด
3. **Data Validation:** ตรวจสอบความถูกต้องของข้อมูลทุก Endpoint ด้วย Zod Schema ก่อนบันทึกลงฐานข้อมูลเสมอ

---

## 4. คู่มือการเรียกใช้ Skills เฉพาะทาง (.agents/skills/)

เมื่อทำงานในแต่ละด้าน ให้ศึกษาและปฏิบัติตามคำแนะนำใน skill ที่เกี่ยวข้อง:

| งานที่ทำ | Skill ที่ต้องใช้งาน | เอกสารอ้างอิง |
|---|---|---|
| **สร้าง/แก้ไข Nuxt UI, Components, Forms, Tables ด้วย Tailwind CSS** | `web-ui-coding-standards` | [`.agents/skills/web-ui-coding-standards/SKILL.md`](./.agents/skills/web-ui-coding-standards/SKILL.md)<br>- [App Shells](./.agents/skills/web-ui-coding-standards/references/app-shells.md)<br>- [Data Tables](./.agents/skills/web-ui-coding-standards/references/data-tables.md) |
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
