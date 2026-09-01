# 🎓 CWIE BRU — Co-op Supervision System

> **ระบบบริหารจัดการและนิเทศงานสหกิจศึกษา (Cooperative Education Management & Supervision System)**  
> ระบบสำหรับบริหารจัดการและติดตามการฝึกงานสหกิจศึกษาของนักศึกษา ตั้งแต่การเลือกสถานประกอบการ การจัดสรรอาจารย์นิเทศ การวางแผนตารางนิเทศ การบันทึกผลและประเมินผล ไปจนถึงการคำนวณค่าใช้จ่ายในการนิเทศ

> **สถานะปัจจุบัน:** Database foundation และ Authentication/Session/RBAC พร้อมใช้งานแล้ว
> ส่วน Feature API อื่นกำลังพัฒนาแบบทีละ Checkpoint ดูสถานะที่ [`dosc/backend-plan.md`](./dosc/backend-plan.md)

---

## ✨ ฟีเจอร์หลักของระบบ (Key Features)

ระบบถูกออกแบบมาเพื่อรองรับ 3 บทบาทหลักตามกระบวนการสหกิจศึกษา:

### 1. 🏢 ส่วนสำหรับเจ้าหน้าที่ (Admin / Staff)
- **จัดการข้อมูล Master Data:** เพิ่ม ลบ แก้ไข และสืบค้นข้อมูลนักศึกษา อาจารย์ และสถานประกอบการ
- **นำเข้าและส่งออกข้อมูล:** นำเข้า-ส่งออกข้อมูลนักศึกษาด้วยไฟล์ CSV และ Excel (`.xlsx`) พร้อมระบบตรวจสอบความถูกต้อง
- **จัดการรอบสหกิจศึกษา:** จัดการข้อมูลปีการศึกษา ภาคเรียน และเปิด-ปิดสถานะรอบสหกิจ
- **จัดกลุ่มนิเทศ:** กำหนดอาจารย์และสถานประกอบการ แยกการนิเทศครั้งที่ 1 และ 2
- **ติดตามการนิเทศ:** ดูตารางและความครบถ้วนของผลกับแบบประเมินแบบอ่านอย่างเดียว

### 2. 👨‍🏫 ส่วนสำหรับอาจารย์นิเทศ (Lecturer / Supervisor)
- **เข้าสู่ระบบ / ยืนยันตัวตน:** ระบบเข้าสู่ระบบตามสิทธิ์อาจารย์
- **ดูตารางนิเทศ:** ดูตารางนิเทศที่ตนเองได้รับมอบหมาย แยกตามครั้งที่ 1 และ 2
- **ดูข้อมูลนักศึกษาและสถานประกอบการ:** ค้นหาและดูรายละเอียดนักศึกษาและสถานประกอบการที่ได้รับมอบหมาย
- **อัปเดตสถานะการนิเทศ:** บันทึกสถานะ (จัดตารางแล้ว, นิเทศเสร็จแล้ว, เลื่อน, ยกเลิก)
- **บันทึกผลและข้อเสนอแนะ:** บันทึกผลการนิเทศ ความก้าวหน้า และข้อเสนอแนะ
- **ประเมินผล:** ประเมินสมรรถนะนักศึกษา และประเมินสถานประกอบการหลังการนิเทศ

### 3. 🎓 ส่วนสำหรับนักศึกษา (Student)
- **เข้าสู่ระบบ / ยืนยันตัวตน:** ระบบเข้าสู่ระบบสำหรับนักศึกษา
- **ค้นหาและเลือกสถานประกอบการ:** ค้นหา ดูข้อมูล และเลือกสถานประกอบการที่ต้องการไปปฏิบัติงาน
- **ตรวจสอบผลการยืนยัน:** ดูสถานประกอบการที่ได้รับการยืนยันเป็นสถานที่ฝึกงานของตนเอง
- **ดูตารางนิเทศ:** ดูตารางนิเทศของตนเอง (ครั้งที่นิเทศ วันที่ เวลา สถานประกอบการ และอาจารย์ผู้รับผิดชอบ)

---

## 🛠️ เทคโนโลยีที่ใช้ (Tech Stack)

| ส่วนของระบบ | เทคโนโลยีที่เลือกใช้ |
|---|---|
| **App Framework** | [Nuxt 4](https://nuxt.com/) (Vue 3 Composition API + Nitro Engine) |
| **Styling & UI** | [Tailwind CSS v4](https://tailwindcss.com/) + [Reka UI](https://reka-ui.com/) (Headless Primitives) |
| **Icons** | [Lucide Icons](https://lucide.dev/) (`@lucide/vue`) |
| **Date & Time** | [date-fns](https://date-fns.org/) |
| **Schema Validation** | [Zod](https://zod.dev/) |
| **Database & ORM (ระยะ Backend)** | [MySQL 8.4 LTS](https://dev.mysql.com/doc/refman/8.4/en/) + [Prisma ORM](https://www.prisma.io/) |
| **Authentication** | [nuxt-auth-utils](https://github.com/atinux/nuxt-auth-utils) (Session-based RBAC) |
| **Data Processing** | `read-excel-file` + `write-excel-file` และ CSV utilities |
| **DevOps & Deploy** | Docker (Multi-stage build) + Docker Compose |

---

## 📁 โครงสร้างโปรเจกต์ (Project Structure)

```text
ciwie-comsci/
├── app/
│   ├── assets/
│   │   └── css/main.css          # Tailwind CSS configuration
│   ├── components/               # UI Presentational Components
│   ├── composables/              # Business Logic & Shared State
│   ├── layouts/                  # Layouts (default, admin, student, etc.)
│   ├── pages/                    # File-based Routing
│   └── app.vue                   # Root Application Component
├── server/
│   ├── api/                      # Nitro API Endpoints
│   ├── core/                     # Database, API errors, validation และ audit
│   └── middleware/               # Server-side Auth & RBAC Middleware
├── prisma/
│   ├── migrations/               # Prisma migration history
│   ├── seed.ts                   # Seed จังหวัด รอบสหกิจ และ Staff จาก environment
│   └── schema.prisma             # MySQL data model จำนวน 25 models
├── dosc/
│   ├── requirement.md            # Requirement Documentation
│   ├── architecture.md           # UI-first Architecture
│   └── ui-plan.md                # UI Checkpoints and Acceptance Plan
├── Dockerfile                    # Multi-stage Production Dockerfile
├── docker-compose.yml            # MySQL → one-shot migration → Nuxt app
├── nuxt.config.ts                # Nuxt Configuration
├── package.json
└── AGENTS.md                     # Coding Guidelines for AI & Developers
```

---

## 🚀 การติดตั้งและเริ่มใช้งาน (Getting Started)

### ความต้องการของระบบ (Prerequisites)
- **Node.js**: `v20` หรือ `v22+`
- **Package Manager**: `pnpm` 11 (Docker image ใช้ 11.18.0)
- **Docker Desktop** หรือ MySQL 8.4 สำหรับงาน Backend

### 1. โคลนโปรเจกต์และติดตั้ง Dependencies
```bash
git clone https://github.com/jirayu-ct-dev/ciwie-comsci.git
cd ciwie-comsci
pnpm install
```

### 2. รัน Development Server
```bash
pnpm dev
```
เปิดเบราว์เซอร์และเข้าไปที่ `http://localhost:3000`

ก่อนรัน Backend แบบ local ให้คัดลอก `.env.example` เป็น `.env`, ตั้งค่า `DATABASE_URL`
กับ `NUXT_SESSION_PASSWORD` ที่สุ่มและยาวอย่างน้อย 32 ตัว แล้วรัน migration และ seed
ตามคำสั่งด้านล่าง

---

## 🐳 Docker และฐานข้อมูล

Docker Compose เริ่มบริการตามลำดับ MySQL healthy → migration สำเร็จ → Nuxt app

```bash
# เริ่มฐานข้อมูล, apply migration และเปิด app
docker compose up -d

# Seed ข้อมูลตั้งต้น (ตั้งค่า SEED_STAFF_* ใน .env ก่อนหากต้องการสร้าง Staff)
docker compose --profile tools run --rm seed

# ตรวจสถานะและ log
docker compose ps -a
docker compose logs migration app
```

ค่าเริ่มต้นคือ app ที่ `http://localhost:3000` และ MySQL ที่ `localhost:3306`.
ห้ามใช้รหัสผ่านตัวอย่างจาก repository ใน production และให้ตั้ง
`NUXT_SESSION_COOKIE_SECURE=true` เมื่อเปิดระบบผ่าน HTTPS

---

## 📜 คำสั่งสำหรับพัฒนา (Available Scripts)

```bash
# รัน Dev Server พร้อม Hot Module Replacement
pnpm dev

# ตรวจสอบและสร้าง Types
pnpm postinstall

# Build โปรเจกต์สำหรับ Production
pnpm build

# พรีวิว Production Build
pnpm preview

# ตรวจคุณภาพ
pnpm test
pnpm test:integration
pnpm typecheck
pnpm lint
pnpm prisma validate

# Prisma database workflow
pnpm db:generate
pnpm db:migrate
pnpm db:migrate:deploy
pnpm db:seed
pnpm db:reset
```

---

## 📄 ใบอนุญาต (License)

โปรเจกต์นี้พัฒนาขึ้นสำหรับระบบบริหารจัดการสหกิจศึกษา สงวนลิขสิทธิ์ตามข้อตกลงของสถาบัน/องค์กร
