import { createProductCard } from '../messages/flexMenu.js';
import {
  askGemini,
  clearChatHistory,
  isGeminiConfigured,
} from '../services/geminiService.js';

const COMMANDS = {
  สวัสดี: () => [
    { type: 'text', text: 'สวัสดีครับ! พิมพ์ "ถาม" ตามด้วยคำถาม หรือ "ช่วยเหลือ"' },
  ],
  ช่วยเหลือ: () => [
    {
      type: 'text',
      text: [
        'คำสั่งที่ใช้ได้:',
        '• สวัสดี — ทักทาย',
        '• สินค้า — แสดง Flex Message',
        '• ถาม <คำถาม> — ถาม Gemini AI',
        '• ai <คำถาม> — ถาม Gemini AI (ภาษาอังกฤษ)',
        '• ล้าง — ล้างประวัติการสนทนากับ AI',
        '• ช่วยเหลือ — แสดงคำสั่งนี้',
      ].join('\n'),
    },
  ],
  สินค้า: () => [createProductCard()],
  ล้าง: () => [{ type: 'text', text: 'ล้างประวัติแล้ว — เริ่มคุยกับ AI ใหม่ได้' }],
};

const AI_PREFIXES = ['ถาม ', 'ai ', 'AI '];

function extractAiQuestion(text) {
  for (const prefix of AI_PREFIXES) {
    if (text.startsWith(prefix)) {
      return text.slice(prefix.length).trim();
    }
  }
  return null;
}

export async function handleMessage(client, event) {
  if (event.message.type !== 'text') {
    return null;
  }

  const userId = event.source.userId ?? 'anonymous';
  const text = event.message.text.trim();
  const lowerText = text.toLowerCase();

  // 1. Personalized Greeting
  if (lowerText === 'สวัสดี') {
    let displayName = '';
    try {
      if (userId !== 'anonymous') {
        const profile = await client.getProfile(userId);
        displayName = profile.displayName;
      }
    } catch (err) {
      console.error('Failed to get user profile:', err.message);
    }
    const greetingText = displayName ? `สวัสดีครับ คุณ ${displayName}` : 'สวัสดีครับ';
    return client.replyMessage({
      replyToken: event.replyToken,
      messages: [{ type: 'text', text: greetingText }]
    });
  }

  // 2. Flex Message Response
  if (lowerText === 'flex') {
    return client.replyMessage({
      replyToken: event.replyToken,
      messages: [createProductCard()]
    });
  }

  if (text === 'ล้าง') {
    clearChatHistory(userId);
    return client.replyMessage({
      replyToken: event.replyToken,
      messages: [{ type: 'text', text: 'ล้างประวัติแล้ว — เริ่มคุยกับ AI ใหม่ได้' }]
    });
  }

  // 3. n8n AI integration forwarding (if webhook URL is set)
  if (process.env.N8N_WEBHOOK_URL) {
    try {
      await fetch(process.env.N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          replyToken: event.replyToken,
          text,
          displayName: event.source.displayName || 'User'
        })
      });
      return null;
    } catch (err) {
      console.error('[n8n forwarding failed]', err.message);
    }
  }

  // 4. Default: AI Chatbot Integration (Gemini)
  return replyWithGemini(client, event, userId, text);
}

async function showAiLoading(client, userId) {
  if (!userId || userId === 'anonymous') return;

  try {
    await client.showLoadingAnimation({
      chatId: userId,
      loadingSeconds: 20,
    });
  } catch (err) {
    console.warn('[loading]', err.message);
  }
}

async function replyWithGemini(client, event, userId, question) {
  if (!question) {
    return null;
  }

  if (!isGeminiConfigured()) {
    return client.replyMessage({
      replyToken: event.replyToken,
      messages: [
        {
          type: 'text',
          text: 'ยังไม่ได้ตั้งค่า GEMINI_API_KEY ในระบบ\nกรุณาติดต่อผู้ดูแลเพื่อตั้งค่า API Key',
        },
      ],
    });
  }

  try {
    await showAiLoading(client, userId);
    const answer = await askGemini(userId, question);
    return client.replyMessage({
      replyToken: event.replyToken,
      messages: [{ type: 'text', text: answer }],
    });
  } catch (err) {
    console.error('[Gemini]', err);
    return client.replyMessage({
      replyToken: event.replyToken,
      messages: [
        {
          type: 'text',
          text: 'ขออภัย AI ตอบไม่ได้ในขณะนี้ ลองใหม่อีกครั้งครับ',
        },
      ],
    });
  }
}
