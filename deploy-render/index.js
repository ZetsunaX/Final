/**
 * index.js - Express Server for Render Deployment
 */
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import * as line from '@line/bot-sdk';
import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Message Templates and Handlers
import { createQueueFlex, createOrderFlex } from './messages/pixelFlex.js';
import { createProductCard } from './messages/flexMenu.js';
import { processEvents } from './handlers/webhook.js';
import { askGemini, isGeminiConfigured } from './services/geminiService.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ----------------------------------------------------
// Firebase Admin Initialization
// ----------------------------------------------------
if (getApps().length === 0) {
  const serviceAccountEnv = process.env.FIREBASE_SERVICE_ACCOUNT;
  const serviceAccountPath = path.join(__dirname, 'service-account.json');

  if (serviceAccountEnv) {
    try {
      const serviceAccount = JSON.parse(serviceAccountEnv);
      initializeApp({
        credential: cert(serviceAccount)
      });
      console.log('✔ Firebase Admin initialized using FIREBASE_SERVICE_ACCOUNT env');
    } catch (err) {
      console.error('❌ Failed to parse FIREBASE_SERVICE_ACCOUNT env:', err.message);
    }
  } else if (fs.existsSync(serviceAccountPath)) {
    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
    initializeApp({
      credential: cert(serviceAccount)
    });
    console.log('✔ Firebase Admin initialized using service-account.json');
  } else {
    // Local emulator environment / fallback
    initializeApp();
    console.log('✔ Firebase Admin initialized with default configs');
  }
}
const db = getFirestore();

// ----------------------------------------------------
// Express App and Webhook Client Setup
// ----------------------------------------------------
const app = express();
app.use(cors({ origin: true }));

const config = {
  channelSecret: process.env.CHANNEL_SECRET || '',
};

const client = line.LineBotClient.fromChannelAccessToken({
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN || '',
});

// --- LINE Webhook endpoint (MUST be registered BEFORE express.json() to prevent stream parsing conflicts) ---
app.post('/webhook', line.middleware(config), async (req, res) => {
  try {
    await processEvents(client, req.body.events);
    res.status(200).send('OK');
  } catch (err) {
    console.error('Webhook processing failed:', err);
    res.status(500).send('Internal Server Error');
  }
});

// Backward compatibility callback route
app.post('/callback', line.middleware(config), async (req, res) => {
  try {
    await processEvents(client, req.body.events);
    res.status(200).send('OK');
  } catch (err) {
    console.error('Callback processing failed:', err);
    res.status(500).send('Internal Server Error');
  }
});

// --- Global JSON Body Parser (registered after webhook to parse API payloads) ---
app.use(express.json());

// ----------------------------------------------------
// REST API Endpoints
// ----------------------------------------------------

// Client configuration injection
app.get('/api/config', (req, res) => {
  res.json({
    liffId: process.env.LIFF_ID || ''
  });
});

// Book queue slot
app.post('/api/queue', async (req, res) => {
  const { username, phone, slot, date, userId, displayName } = req.body;

  if (!username || !phone || !slot || !date || !userId) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }

  try {
    const counterRef = db.collection('counters').doc('queues');
    
    const queueNumber = await db.runTransaction(async (transaction) => {
      const counterDoc = await transaction.get(counterRef);
      let currentNum = 1;
      
      if (counterDoc.exists) {
        const data = counterDoc.data();
        if (data.lastResetDate === date) {
          currentNum = (data.currentNumber || 0) + 1;
        }
      }

      transaction.set(counterRef, {
        currentNumber: currentNum,
        lastResetDate: date
      }, { merge: true });

      return currentNum;
    });

    const formattedQueueNumber = `Q-${String(queueNumber).padStart(3, '0')}`;

    const queueData = {
      userId,
      displayName: displayName || '',
      username,
      phone,
      slot,
      date,
      queueNumber: formattedQueueNumber,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    await db.collection('queues').add(queueData);

    // Send Pixel-Art Flex Message Confirmation to LINE Chat
    try {
      await client.pushMessage({
        to: userId,
        messages: [createQueueFlex(queueData)]
      });
    } catch (err) {
      console.error('Failed to push queue Flex Message:', err.message);
    }

    return res.status(201).json({
      success: true,
      queueNumber: formattedQueueNumber,
      queue: queueData
    });

  } catch (err) {
    console.error('Queue booking transaction failed:', err);
    return res.status(500).json({ error: 'Database transaction failed' });
  }
});

// Check user's active queue
app.get('/api/my-queue/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    const snapshot = await db.collection('queues')
      .where('userId', '==', userId)
      .where('status', 'in', ['pending', 'processing'])
      .orderBy('createdAt', 'desc')
      .limit(1)
      .get();

    if (snapshot.empty) {
      return res.status(404).json({ error: 'No active queue bookings found' });
    }

    const queue = snapshot.docs[0].data();
    return res.json(queue);
  } catch (err) {
    console.error('Failed to get my-queue:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Place shop order
app.post('/api/order', async (req, res) => {
  const { userId, displayName, username, items, totalPrice } = req.body;

  if (!userId || !username || !items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Invalid order input' });
  }

  const orderId = `ORD-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

  const orderData = {
    orderId,
    userId,
    displayName: displayName || '',
    username,
    items,
    totalPrice,
    status: 'pending',
    paymentStatus: 'pending',
    createdAt: new Date().toISOString()
  };

  try {
    await db.collection('orders').doc(orderId).set(orderData);

    // Push order received Flex Message to user
    try {
      await client.pushMessage({
        to: userId,
        messages: [createOrderFlex(orderData)]
      });
    } catch (err) {
      console.error('Failed to push order Flex Message:', err.message);
    }

    return res.status(201).json({
      success: true,
      orderId,
      totalPrice
    });
  } catch (err) {
    console.error('Failed to save order:', err);
    return res.status(500).json({ error: 'Failed to create order' });
  }
});

// Verify payment receipt slip upload
app.post('/api/order/:orderId/pay', async (req, res) => {
  const { orderId } = req.params;
  const { slipBase64 } = req.body;

  try {
    const orderRef = db.collection('orders').doc(orderId);
    const orderDoc = await orderRef.get();

    if (!orderDoc.exists) {
      return res.status(404).json({ error: 'Order not found' });
    }

    await orderRef.update({
      paymentStatus: 'verified',
      status: 'completed',
      slipBase64: slipBase64 || '',
      paidAt: new Date().toISOString()
    });

    const orderData = orderDoc.data();

    // Push verification confirmation text
    try {
      await client.pushMessage({
        to: orderData.userId,
        messages: [
          {
            type: 'text',
            text: `🟢 ชำระเงินเรียบร้อยแล้ว!\nรหัสสั่งซื้อ: ${orderId}\nขอบคุณสำหรับการสั่งซื้อ ระบบกำลังจัดส่งสินค้า/เติมเงินในเซิร์ฟเวอร์เกม 🎮`
          }
        ]
      });
    } catch (err) {
      console.error('Failed to push payment confirmation message:', err.message);
    }

    return res.json({ success: true });
  } catch (err) {
    console.error('Payment processing failed:', err);
    return res.status(500).json({ error: 'Payment processing failed' });
  }
});

// Dialogflow Fulfillment Webhook
app.post('/api/webhook/dialogflow', async (req, res) => {
  const intentName = req.body.queryResult?.intent?.displayName || '';
  const queryText = req.body.queryResult?.queryText || '';
  const parameters = req.body.queryResult?.parameters;
  const originalRequest = req.body.originalDetectIntentRequest;

  let lineUserId = '';
  if (originalRequest?.source === 'line') {
    lineUserId = originalRequest.payload?.data?.source?.userId || '';
  }

  // Normal intents
  if (intentName === 'Check Queue' || intentName === 'check_queue') {
    const username = parameters?.username;
    let snapshot;
    let responseText = '';

    try {
      if (lineUserId) {
        snapshot = await db.collection('queues')
          .where('userId', '==', lineUserId)
          .where('status', 'in', ['pending', 'processing'])
          .orderBy('createdAt', 'desc')
          .limit(1)
          .get();
      }

      if ((!snapshot || snapshot.empty) && username) {
        snapshot = await db.collection('queues')
          .where('username', '==', username)
          .where('status', 'in', ['pending', 'processing'])
          .orderBy('createdAt', 'desc')
          .limit(1)
          .get();
      }

      if (snapshot && !snapshot.empty) {
        const queue = snapshot.docs[0].data();
        responseText = `🎮 พบข้อมูลการจองคิวของคุณแล้ว!\nคิวหมายเลข: ${queue.queueNumber}\nผู้เล่น: ${queue.username}\nเวลา: ${queue.slot === 'Morning' ? 'เช้า (09:00 - 13:30)' : 'บ่าย (13:30 - 18:00)'}\nสถานะ: ${queue.status === 'pending' ? 'กำลังรอการดำเนินการ' : 'กำลังดำเนินการ'}`;
      } else {
        responseText = `❌ ไม่พบการจองคิวที่กำลังรอนำเนินการในขณะนี้${username ? ` ของผู้เล่น ${username}` : ''}`;
      }
    } catch (err) {
      console.error('Queue check in Dialogflow failed:', err);
      responseText = 'เกิดข้อผิดพลาดในการตรวจสอบคิว';
    }
    return res.json({ fulfillmentText: responseText });
  }

  if (intentName === 'Check Shop' || intentName === 'check_shop') {
    return res.json({
      fulfillmentText: `🛒 สินค้าแนะนำวันนี้:\n💎 64x Diamond - ฿50\n⚔️ Netherite Sword - ฿120\n🌟 VIP Rank (30 วัน) - ฿300\n\nสามารถเปิดหน้า Shop ใน Rich Menu เพื่อทำรายการได้ทันทีครับ!`
    });
  }

  // Final Exam: Greeting
  if (intentName.toLowerCase().includes('welcome') || intentName.toLowerCase().includes('greet') || queryText === 'สวัสดี') {
    let displayName = '';
    try {
      if (lineUserId) {
        const profile = await client.getProfile(lineUserId);
        displayName = profile.displayName;
      }
    } catch (err) {
      console.error('Failed to get profile for Dialogflow greeting:', err.message);
    }
    const responseText = displayName ? `สวัสดีครับ คุณ ${displayName}` : 'สวัสดีครับ';
    return res.json({ fulfillmentText: responseText });
  }

  // Final Exam: Flex Message
  if (intentName.toLowerCase() === 'flex' || queryText.toLowerCase() === 'flex') {
    const cardPayload = createProductCard();
    return res.json({
      fulfillmentMessages: [
        {
          platform: 'LINE',
          payload: {
            line: cardPayload
          }
        },
        {
          text: {
            text: ['นี่คือ Flex Message สินค้าแนะนำครับ']
          }
        }
      ]
    });
  }

  // Final Exam: Gemini AI integration for general question or Coach Nen
  if (queryText) {
    try {
      if (isGeminiConfigured()) {
        const answer = await askGemini(lineUserId || 'dialogflow-session', queryText);
        return res.json({ fulfillmentText: answer });
      }
    } catch (err) {
      console.error('Gemini call from Dialogflow failed:', err);
    }
  }

  return res.json({
    fulfillmentText: 'ระบบได้รับข้อมูลแล้ว แต่ไม่สามารถประมวลผลคำตอบที่เหมาะสมได้'
  });
});

// n8n Response Webhook
app.post('/api/webhook/n8n-reply', async (req, res) => {
  const { userId, replyToken, text } = req.body;

  if (!userId || !text) {
    return res.status(400).json({ error: 'Missing userId or text' });
  }

  try {
    if (replyToken) {
      await client.replyMessage({
        replyToken,
        messages: [{ type: 'text', text }]
      });
    } else {
      await client.pushMessage({
        to: userId,
        messages: [{ type: 'text', text }]
      });
    }
    return res.json({ success: true });
  } catch (err) {
    console.error('Failed to send n8n message to LINE:', err);
    return res.status(500).json({ error: err.message });
  }
});

// ----------------------------------------------------
// Static Web App Serving
// ----------------------------------------------------

// Dynamic window configuration script injection
app.get('/config.js', (req, res) => {
  res.type('application/javascript');
  res.send(
    `window.LIFF_CONFIG = { liffId: ${JSON.stringify(process.env.LIFF_ID ?? '')} };`
  );
});

// Serve frontend assets
app.use(express.static(path.join(__dirname, 'public')));

// Root route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// SPA catch-all redirect
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ----------------------------------------------------
// Server Listen Port
// ----------------------------------------------------
const port = process.env.PORT || 3000;
app.listen(port, '0.0.0.0', () => {
  console.log(`Minecraft LINE OA listening on http://localhost:${port}`);
});
