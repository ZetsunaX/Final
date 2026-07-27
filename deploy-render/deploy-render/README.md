# Deploy LINE Bot บน Render

โฟลเดอร์นี้ mirror โค้ดจาก [step5-gemini](../step5-gemini/) — **`index.js` เหมือนกันทุกประการ** (ใช้ Express + `line.middleware`)

เหมาะสำหรับการสอน เพราะนักศึกษา deploy โค้ดแบบเดียวกับที่รันบนเครื่อง ไม่ต้องแก้ `validateSignature` แบบ Firebase

## โครงสร้างไฟล์

```
deploy-render/
├── index.js              ← เหมือน step5-gemini (ต่างแค่ listen 0.0.0.0)
├── package.json
├── render.yaml           ← ตั้งค่า Render (optional)
├── handlers/
│   ├── webhook.js        ← เหมือน step5
│   ├── messageHandler.js
│   └── eventHandler.js
├── services/
│   └── geminiService.js
└── messages/
    └── flexMenu.js
```

## เปรียบเทียบ Render vs Firebase

| หัวข้อ | Render (โฟลเดอร์นี้) | Firebase |
|--------|---------------------|----------|
| `index.js` | เหมือน local | ต่าง (validateSignature) |
| ตั้งค่า secret | Environment Variables | Firebase Secrets |
| คำสั่งรัน | `npm start` | `firebase deploy` |
| ngrok | ไม่ต้องใช้แล้ว | ไม่ต้องใช้แล้ว |

---

## วิธีที่ 1: Deploy ผ่าน Render Dashboard (แนะนำสำหรับนักศึกษา)

### ขั้นตอนที่ 1 — เตรียม GitHub

1. Push โปรเจกต์ขึ้น GitHub (ทั้ง repo หรือแยกเฉพาะโฟลเดอร์ `deploy-render`)
2. **ห้าม** commit ไฟล์ `.env` ที่มี secret จริง

### ขั้นตอนที่ 2 — สร้าง Web Service บน Render

1. สมัคร / เข้าสู่ระบบ [Render](https://render.com/)
2. กด **New +** → **Web Service**
3. เชื่อม GitHub repository
4. ตั้งค่าดังนี้:

| การตั้งค่า | ค่าที่ใส่ |
|-----------|----------|
| Name | `line-chatbot` (หรือชื่อที่ต้องการ) |
| Region | Singapore (ใกล้ไทย) |
| Branch | `main` |
| Root Directory | `deploy-render` (ถ้า repo เป็น monorepo ทั้งโปรเจกต์) |
| Runtime | Node |
| Build Command | `npm install` |
| Start Command | `npm start` |
| Instance Type | Free |

5. ขยาย **Environment Variables** แล้วเพิ่ม:

| Key | Value |
|-----|-------|
| `CHANNEL_SECRET` | จาก LINE Developers Console |
| `CHANNEL_ACCESS_TOKEN` | จาก LINE Developers Console |
| `GEMINI_API_KEY` | จาก [Google AI Studio](https://aistudio.google.com/apikey) |
| `GEMINI_MODEL` | `gemini-3.1-flash-lite` (optional) |

6. กด **Create Web Service** — รอ deploy สำเร็จ (สถานะ Live)

### ขั้นตอนที่ 3 — ตั้ง Webhook ใน LINE

1. คัดลอก URL จาก Render เช่น `https://line-chatbot-xxxx.onrender.com`
2. ไป [LINE Developers Console](https://developers.line.biz/console/) → แท็บ **Messaging API**
3. ตั้งค่า:

| การตั้งค่า | ค่า |
|-----------|-----|
| Webhook URL | `https://line-chatbot-xxxx.onrender.com/callback` |
| Verify | กดแล้วต้องได้ **Success** |
| Use webhook | เปิด (ON) |

4. ส่งข้อความทดสอบให้บอท เช่น `ช่วยเหลือ` หรือ `ถาม JavaScript คืออะไร`

---

## วิธีที่ 2: Deploy ด้วย render.yaml (Blueprint)

ถ้า repo อยู่ที่ root ของ `linechatbot2026`:

1. กด **New +** → **Blueprint** บน Render
2. เชื่อม GitHub repo
3. Render อ่านไฟล์ `deploy-render/render.yaml` (หรือย้าย `render.yaml` ไป root แล้วแก้ `rootDir`)
4. ใส่ค่า secret เมื่อ Render ถาม

---

## ทดสอบบนเครื่องก่อน deploy

```bash
cd deploy-render
npm install
cp .env.example .env
# แก้ไข .env ใส่ค่าจริง

npm start
```

`deploy-render` ใช้ `node` (ไม่ใช่ nodemon) — เหมือนการรันบน Render จริง

เปิด `http://localhost:3000` — ต้องเห็นข้อความ `LINE Bot on Render`

ทดสอบ webhook ด้วย ngrok เหมือน step อื่น (ก่อน deploy จริง)

---

## อัปเดตโค้ดหลังแก้ step5

copy ไฟล์จาก `step5-gemini` มา `deploy-render`:

```
handlers/webhook.js
handlers/messageHandler.js
handlers/eventHandler.js
services/geminiService.js
messages/flexMenu.js
index.js          ← เก็บ listen('0.0.0.0') ไว้
```

commit → push → Render deploy อัตโนมัติ

---

## แก้ปัญหาที่พบบ่อย

| อาการ | สาเหตุ | วิธีแก้ |
|-------|--------|--------|
| Webhook Verify ล้มเหลว | service ยังไม่ Live | รอ deploy เสร็จ / ดู Logs |
| บอทไม่ตอบครั้งแรกหลัง idle | Free tier sleep | รอ 30–60 วินาที แล้วลองใหม่ |
| 401 Invalid signature | `CHANNEL_SECRET` ผิด | ตรวจ Environment Variables |
| Gemini ไม่ตอบ | `GEMINI_API_KEY` ไม่ได้ตั้ง | เพิ่มใน Render Dashboard |
| Build fail | Node version | ตั้ง `NODE_VERSION=20` ใน env |

---

## หมายเหตุ Free tier

- Render Free จะ **sleep** เมื่อไม่มี traffic — request แรกหลัง sleep อาจช้า
- สำหรับการสอน / demo ใช้ได้ดี
- Production จริงควรใช้แผน Paid หรือตัวเลือกอื่น (Firebase, Railway)
