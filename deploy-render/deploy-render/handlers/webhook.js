import { handleMessage } from './messageHandler.js';
import { handleEvent as handleOtherEvent } from './eventHandler.js';

export async function handleWebhookEvent(client, event) {
  if (event.type === 'message') {
    return handleMessage(client, event);
  }
  return handleOtherEvent(client, event);
}

/** วน loop ทุก event — LINE อาจส่งหลายข้อความใน request เดียว */
export async function processEvents(client, events) {
  for (const event of events ?? []) {
    try {
      await handleWebhookEvent(client, event);
    } catch (err) {
      console.error('processEvents failed:', err);
    }
  }
}
