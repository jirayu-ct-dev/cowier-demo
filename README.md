# 🎓 Cowier Co-op Supervision System

> **ระบบบริหารจัดการและนิเทศงานสหกิจศึกษา (Cooperative Education Management & Supervision System)**  
> ระบบสำหรับบริหารจัดการและติดตามการฝึกงานสหกิจศึกษาของนักศึกษา ตั้งแต่การเลือกสถานประกอบการ การจัดสรรอาจารย์นิเทศ การวางแผนตารางนิเทศ การบันทึกผลและประเมินผล ไปจนถึงการคำนวณค่าใช้จ่ายในการนิเทศ

---

## ✨ ฟีเจอร์หลักของระบบ (Key Features)

ระบบถูกออกแบบมาเพื่อรองรับ 3 บทบาทหลักตามกระบวนการสหกิจศึกษา:

### 1. 🏢 ส่วนสำหรับเจ้าหน้าที่ (Admin / Staff)
- **จัดการข้อมูล Master Data:** เพิ่ม ลบ แก้ไข และสืบค้นข้อมูลนักศึกษา อาจารย์ และสถานประกอบการ
- **นำเข้าและส่งออกข้อมูล:** นำเข้า-ส่งออกข้อมูลนักศึกษาด้วยไฟล์ CSV และ Excel (`.xlsx`) พร้อมระบบตรวจสอบความถูกต้อง
- **จัดการรอบสหกิจศึกษา:** จัดการข้อมูลปีการศึกษา ภาคเรียน และเปิด-ปิดสถานะรอบสหกิจ
- **จัดสรรพื้นที่และความรับผิดชอบ:** กำหนดพื้นที่รับผิดชอบให้อาจารย์ตามภูมิภาค จังหวัด หรือสถานประกอบการ
- **วางแผนและจัดตารางนิเทศ:** คัดกรองนักศึกษาเพื่อสร้างและแก้ไขตารางนิเทศ (แบ่งเป็นการนิเทศครั้งที่ 1 และ 2)
- **ระบบตรวจสอบเวลาชนกัน (Conflict Detection):** ตรวจสอบตารางเวลาที่ซ้ำหรือชนกันของอาจารย์ นักศึกษา และสถานประกอบการ
- **คำนวณค่าใช้จ่าย:** บันทึกค่าเดินทาง ค่าที่พัก ค่าเบี้ยเลี้ยง/อาหาร และคำนวณสรุปยอดรวมค่าใช้จ่าย

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
| **Styling & UI** | [Tailwind CSS v4](https://tailwindcss.com/) + [Radix UI](https://www.radix-vue.com/) (Headless Primitives) |
| **Icons** | [Lucide Icons](https://lucide.dev/) (`@lucide/vue`) |
| **Date & Time** | [date-fns](https://date-fns.org/) |
| **Schema Validation** | [Zod](https://zod.dev/) |
| **Database & ORM** | [PostgreSQL 16](https://www.postgresql.org/) + [Prisma ORM](https://www.prisma.io/) |
| **Authentication** | [nuxt-auth-utils](https://github.com/atinux/nuxt-auth-utils) (Session-based RBAC) |
| **Data Processing** | [exceljs](https://github.com/exceljs/exceljs) + [papaparse](https://www.papaparse.com/) |
| **DevOps & Deploy** | Docker (Multi-stage build) + Docker Compose |

---

## 📁 โครงสร้างโปรเจกต์ (Project Structure)

```text
cowier-demo/
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
│   ├── middleware/               # Server-side Auth & RBAC Middleware
│   └── utils/                    # Server Utilities
├── prisma/
│   └── schema.prisma             # PostgreSQL Database Schema
├── dosc/
│   └── requirement.md            # Requirement Documentation
├── Dockerfile                    # Multi-stage Production Dockerfile
├── docker-compose.yml            # App + PostgreSQL Services
├── nuxt.config.ts                # Nuxt Configuration
├── package.json
└── AGENTS.md                     # Coding Guidelines for AI & Developers
```

---

## 🚀 การติดตั้งและเริ่มใช้งาน (Getting Started)

### ความต้องการของระบบ (Prerequisites)
- **Node.js**: `v20` หรือ `v22+`
- **Package Manager**: `pnpm` (แนะนำเวอร์ชัน 10 ขึ้นไป)
- **Database**: PostgreSQL 16 หรือ Docker

### 1. โคลนโปรเจกต์และติดตั้ง Dependencies
```bash
git clone https://github.com/jirayu-ct-dev/cowier-demo.git
cd cowier-demo
pnpm install
```

### 2. ตั้งค่าตัวแปรสภาพแวดล้อม (Environment Variables)
คัดลอกไฟล์ `.env.example` เป็น `.env`:
```bash
cp .env.example .env
```
กำหนดค่าในไฟล์ `.env`:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/cowier_db?schema=public"
NUXT_SESSION_PASSWORD="your-secure-random-32-character-secret-key"
```

### 3. ตั้งค่าฐานข้อมูล (Database Migration)
```bash
# สร้าง Prisma Client
pnpm exec prisma generate

# อัปเดตโครงสร้างตารางลงในฐานข้อมูล
pnpm exec prisma db push
```

### 4. รัน Development Server
```bash
pnpm dev
```
เปิดเบราว์เซอร์และเข้าไปที่ `http://localhost:3000`

---

## 🐳 การรันด้วย Docker (Docker & Docker Compose)

คุณสามารถรันระบบทั้งหมด (ทั้ง Nuxt App และ PostgreSQL) ได้ง่ายๆ ด้วยคำสั่งเดียว:

```bash
# เริ่มการทำงานของ Container ทั้งหมด
docker compose up -d --build

# ดู Logs การทำงาน
docker compose logs -f

# หยุดการทำงาน
docker compose down
```

เมื่อเริ่มทำงานแล้ว สามารถเข้าใช้งานผ่านเบราว์เซอร์ที่:
- **Web Application**: `http://localhost:3000`
- **PostgreSQL Database**: `localhost:5432`

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

# จัดรูปแบบและตรวจสอบ Prisma Schema
pnpm exec prisma validate
pnpm exec prisma format
```

---

## 📄 ใบอนุญาต (License)

โปรเจกต์นี้พัฒนาขึ้นสำหรับระบบบริหารจัดการสหกิจศึกษา สงวนลิขสิทธิ์ตามข้อตกลงของสถาบัน/องค์กร
