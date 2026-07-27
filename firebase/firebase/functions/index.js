import { onRequest } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import app from './app.js';

const channelSecret = defineSecret('CHANNEL_SECRET');
const channelAccessToken = defineSecret('CHANNEL_ACCESS_TOKEN');
const geminiApiKey = defineSecret('GEMINI_API_KEY');

export const lineWebhook = onRequest(
  {
    region: 'asia-southeast1',
    secrets: [channelSecret, channelAccessToken, geminiApiKey],
  },
  app
);
