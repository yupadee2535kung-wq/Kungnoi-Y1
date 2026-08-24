# Kungnoi Y. — "ถ้าเธอยังไม่ลืม" (Official Debut Album Website) 🎵✨

เว็บไซต์เครื่องเล่นเพลงและอัลบั้มอย่างเป็นทางการของ **Kungnoi Y.** (เดบิวต์อัลบั้ม *"ถ้าเธอยังไม่ลืม"*) 
พัฒนาด้วย **React 19, TypeScript, Tailwind CSS v4, Motion, Web Audio API และ YouTube Sequential Iframe Player** รองรับการเล่นเพลง MP3 จริงพร้อม Visualizer แบบเรียลไทม์ และระบบสลับโหมดสไลด์โชว์/เล่น MV ระดับพรีเมียม

---

## 🌟 คุณสมบัติเด่น (Key Features)

- 🎵 **เครื่องเล่นเพลงอัลบั้มเต็ม 10 เพลง (Interactive Album Player)**:
  - รองรับการเล่นไฟล์เสียง MP3/WAV จริง พร้อมระบบคลื่นเสียง Real-Time Audio Spectrum (Web Audio API AnalyserNode)
  - มีระบบ Procedural Sound Synthesizer สำรองเมื่อยังไม่ได้ใส่ไฟล์เพลงจริง
  - ระบบเล่นวนซ้ำ (Loop Single / Loop All) และระบบสุ่มเพลง (Shuffle Mode)
  - แสดงเนื้อเพลง (Lyrics), เรื่องราวของเพลง (Story) และคอร์ดกีตาร์ (Guitar Chords) สำหรับทุกแทร็ก
- 🎬 **โหมดเล่น MV และวิดีโอ YouTube เล่นตามลำดับอัตโนมัติ (Sequential YouTube MV Player)**:
  - สลับโหมดการแสดงผลระหว่าง **[🖼️ โหมดภาพสไลด์]** และ **[▶️ โหมดเล่น MV]** ได้ทันทีในกรอบเครื่องเล่นหลัก
  - ใส่ลิงก์วิดีโอ YouTube ได้สูงสุด **10 URL ต่อเพลง** (เช่น Official MV, Live Session, Teaser, Acoustic Version, เบื้องหลัง)
  - เล่นวิดีโออัตโนมัติตามลำดับ 1 → 2 → ... → 10 พร้อมแถบปุ่มลัดเลือกวิดีโอลำดับที่ 1-10 และปุ่มเปิดดูบน YouTube
- 🖼️ **สไลด์โชว์รูปภาพหน้าแรก (Cinematic Slideshow)**:
  - สไลด์โชว์ขนาดใหญ่สัดส่วนภาพยนตร์ (~2.1:1 หรือ 1920×900 px) เปลี่ยนภาพอัตโนมัติ
  - ระบบจัดการสไลด์โชว์: เพิ่มรูปภาพใหม่, ลบรูป, หรือเลือกจากพรีเซ็ตคุณภาพสูง
- 📱 **ปุ่มควบคุมเพลงลอยได้ (Floating Mini Player)**:
  - แถบควบคุมเพลงแบบย่อที่มุมจอด้านล่าง ควบคุมเพลงได้อย่างต่อเนื่องทุกที่บนหน้าเว็บ
- 🔐 **ระบบจัดการรูปภาพ & ข้อมูลสำหรับ Admin (รหัส PIN: `123456`)**:
  - เปลี่ยนปกอัลบั้มหลัก, ภาพฉากหลังเวที, จัดการสไลด์โชว์
  - แก้ไขข้อมูลผู้ดูแลและช่องทางติดต่องานแสดง
  - เพิ่ม/แก้ไข/ลบ และอัปโหลดไฟล์ MP3 ประจำแต่ละบทเพลงโดยตรงจากเบราว์เซอร์ พร้อมบันทึกลง IndexedDB ภายในเครื่อง

---

## 📂 โครงสร้างโฟลเดอร์สำหรับวางไฟล์สื่อ (Media Assets Setup)

คุณสามารถนำไฟล์เพลง MP3 และไฟล์รูปภาพจริงมาวางในโฟลเดอร์ `public/` ก่อนส่งออกหรือ Deploy ไปยัง Vercel / Netlify / GitHub Pages:

### 1. ไฟล์เพลง MP3 (`public/audio/`)
วางไฟล์เพลงทั้ง 10 แทร็กในโฟลเดอร์ `public/audio/` โดยตั้งชื่อตามหมายเลขแทร็ก:
- `01.mp3` : เพลง ถ้าเธอยังไม่ลืม (If You Haven't Forgotten)
- `02.mp3` : เพลง อย่ามองแบบนั้น (Don't Look At Me Like That)
- `03.mp3` : เพลง ใจกลัว...แต่ยังรัก (Afraid Heart... Still In Love)
- `04.mp3` : เพลง คืนที่ไม่มีคำลา (Night Without Goodbye)
- `05.mp3` : เพลง ปล่อยให้เวลาพาเธอไป (Let Time Drift You Away)
- `06.mp3` : เพลง ไม่ได้อยากเป็นคนพิเศษ (Never Wanted To Be Special)
- `07.mp3` : เพลง Between Us
- `08.mp3` : เพลง Still Think About Us
- `09.mp3` : เพลง ลบไม่ได้...ช่วยไม่คิดถึง (Can't Erase... Help Me Forget)
- `10.mp3` : เพลง ถ้าเธอยังไม่ลืม - Acoustic Ver.

### 2. ไฟล์รูปภาพ (`public/images/` และ `src/assets/images/`)
- `slide_01.jpg` ถึง `slide_10.jpg` : รูปภาพจริงคุณภาพสูงประจำแทร็ก 1 ถึง 10 และสไลด์โชว์หลักของอัลบั้ม

---

## 🛠️ วิธีการติดตั้งและรันโปรเจกต์ (Installation & Running)

### 1. โคลน Repository และติดตั้ง Dependencies
```bash
git clone https://github.com/your-username/kungnoi-y-album.git
cd kungnoi-y-album
npm install
```

### 2. รันโหมด Development (ทดสอบในเครื่อง)
```bash
npm run dev
```
เปิดเบราว์เซอร์ไปที่ `http://localhost:3000`

### 3. ตรวจสอบโค้ด (Lint)
```bash
npm run lint
```

### 4. บิลด์สำหรับ Production
```bash
npm run build
```
ไฟล์พร้อม Deploy จะถูกสร้างไว้ในโฟลเดอร์ `dist/`

---

## 🎨 คำแนะนำขนาดภาพ & การตั้งชื่อไฟล์ (Image Specifications & Naming Guide)

เพื่อให้เว็บไซต์แสดงผลได้อย่างคมชัด หรูหรา สวยงามทุกหน้าจอ (มือถือ, แท็บเล็ต, คอมพิวเตอร์) แนะนำขนาดและการตั้งชื่อไฟล์ดังนี้:

| ตำแหน่งการแสดงผล | สัดส่วน (Ratio) | ขนาดที่แนะนำ (Pixels) | รูปแบบไฟล์ | ตัวอย่างชื่อไฟล์ที่แนะนำ |
| :--- | :--- | :--- | :--- | :--- |
| **1. ภาพสไลด์โชว์หน้าแรก (10 Slides)** | 16:9 ถึง 2.1:1 | **1920 × 900 px** หรือ 1920 × 1080 px | JPG, PNG, WEBP | `slide-01-cover.jpg` ถึง `slide-10-acoustic.jpg` |
| **2. ปกอัลบั้มหลัก (Main Album Cover)** | 1:1 (สี่เหลี่ยมจัตุรัส) | **1000 × 1000 px** หรือ 1200 × 1200 px | JPG, PNG | `album-cover-main.jpg` |
| **3. รูปแผ่นเสียงไวนิล (Vinyl Disc Art)** | 1:1 (วงกลม/จัตุรัส) | **800 × 800 px** หรือ 1000 × 1000 px | PNG (พื้นหลังใส) | `vinyl-disc-art.png` |
| **4. ภาพฉากหลังเวที (Concert Stage BG)** | 16:9 Widescreen | **1920 × 1080 px** หรือ 2560 × 1440 px | JPG, WEBP | `stage-background.jpg` |
| **5. รูปพอร์ตเทรตศิลปิน (Artist Portrait)** | 3:4 หรือ 1:1 | **800 × 1000 px** หรือ 1000 × 1000 px | JPG, PNG | `artist-portrait.jpg` |

### 💡 กฎการตั้งชื่อไฟล์ที่ดี (Naming Best Practices):
1. **ใช้ภาษาอังกฤษตัวพิมพ์เล็ก** และเชื่อมคำด้วยเครื่องหมายขีดคั่นกลาง (`-`) เช่น `kungnoi-album-cover.jpg`
2. **ระบุลำดับแทร็กหรือลำดับสไลด์ชัดเจน** เช่น `kungnoi-slide-01.jpg`, `kungnoi-slide-02.jpg`
3. **หลีกเลี่ยงการเว้นวรรคและอักขระพิเศษ** เช่น `#`, `?`, `%`, `&`, หรือภาษาไทยในชื่อไฟล์ เพื่อป้องกันปัญหา URL เสียเมื่อนำขึ้น Vercel / Web Server
4. **ระบบมี Auto-Compress ในตัว**: เมื่ออัปโหลดผ่านหน้า Admin ระบบจะทำการปรับขนาดและบีบอัดภาพให้อัตโนมัติ เพื่อให้หน้าเว็บโหลดรวดเร็วลื่นไหล

---

## 🚀 การส่งออกและ Deploy ไปยัง Vercel (Step-by-Step Vercel Deployment)

โครงสร้างโปรเจกต์นี้ได้รับการตั้งค่าพร้อมไฟล์ `vercel.json`, `.vercelignore` และการบิลด์ด้วย Vite สำหรับ Vercel เรียบร้อยแล้ว 100%

### วิธีที่ 1: Deploy ผ่าน GitHub เข้า Vercel (แนะนำ - สะดวกที่สุด)
1. **Export โค้ดจาก AI Studio**:
   - คลิกที่เมนูด้านบนขวา (หรือไอคอน Settings) ของ Google AI Studio
   - เลือก **Export to GitHub** (หรือเลือก **Download ZIP** แล้วนำโค้ดไป Push ขึ้น GitHub)
2. **เข้าสู่ระบบ [Vercel.com](https://vercel.com)**
3. คลิกปุ่ม **"Add New..."** → เลือก **"Project"**
4. เลือก GitHub Repository ของโปรเจกต์นี้ แล้วกด **"Import"**
5. ตรวจสอบการตั้งค่า (Vercel จะตรวจจับอัตโนมัติจาก `vercel.json`):
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`
6. กดปุ่ม **"Deploy"** รอประมาณ 30-60 วินาที เว็บไซต์จะเปิดใช้งานได้ทันทีพร้อมลิงก์ Domain (เช่น `https://your-project.vercel.app`)

---

### วิธีที่ 2: Deploy ผ่าน Vercel CLI (ในเครื่องคอมพิวเตอร์)
```bash
# 1. ติดตั้ง Vercel CLI
npm install -g vercel

# 2. ทำการ Login
vercel login

# 3. สั่ง Deploy ขึ้น Production
vercel --prod
```

---

## 🔐 รหัสผ่านผู้ดูแลระบบ (Admin PIN)
- **Admin PIN**: `123456` (ใช้สำหรับเข้าสู่ระบบ Admin เพื่อเปลี่ยนรูปภาพ, ลิงก์ MV YouTube, และอัปโหลดไฟล์เพลง)

---

## 📄 License
© Kungnoi Y. & Mozart Music. All Rights Reserved.
