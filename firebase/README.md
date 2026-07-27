# Deploy LINE Bot บน Firebase Cloud Functions

โฟลเดอร์นี้ใช้โครงสร้างเดียวกับ [step5-gemini](../step5-gemini/) — แยกไฟล์เหมือนกัน

## โครงสร้างไฟล์ (เหมือน step5-gemini)

```
functions/
├── index.js              ← ต่างจาก local แค่ส่วน Express vs Cloud Function
├── handlers/
│   ├── webhook.js        ← เหมือน step5 ทุกประการ
│   ├── messageHandler.js ← copy จาก step5
│   └── eventHandler.js   ← copy จาก step5
├── services/
│   └── geminiService.js  ← copy จาก step5
└── messages/
    └── flexMenu.js       ← copy จาก step5
```

## สิ่งที่เหมือน vs ต่าง

| ไฟล์ | step5-gemini | firebase |
|------|-------------|----------|
| `handlers/webhook.js` | เหมือนกัน | เหมือนกัน |
| `handlers/messageHandler.js` | เหมือนกัน | เหมือนกัน |
| `handlers/eventHandler.js` | เหมือนกัน | เหมือนกัน |
| `services/geminiService.js` | เหมือนกัน | เหมือนกัน |
| `index.js` | Express + `line.middleware` | Cloud Function + `validateSignature` |

## วิธีอัปเดต firebase หลังแก้ step

copy ไฟล์จาก `step5-gemini` ไป `firebase/functions/`:

- `handlers/webhook.js`
- `handlers/messageHandler.js`
- `handlers/eventHandler.js`
- `services/geminiService.js`
- `messages/flexMenu.js`

จากนั้น `firebase deploy --only functions`

## Deploy

```bash
cd firebase
firebase functions:secrets:set CHANNEL_SECRET
firebase functions:secrets:set CHANNEL_ACCESS_TOKEN
firebase functions:secrets:set GEMINI_API_KEY

cd functions && npm install && cd ..
firebase deploy --only functions
```
