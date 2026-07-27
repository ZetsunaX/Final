/**
 * create-rich-menu.js - Automate LINE Rich Menu Creation
 * 
 * To run:
 * node create-rich-menu.js
 */
import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const CHANNEL_ACCESS_TOKEN = process.env.CHANNEL_ACCESS_TOKEN;
const LIFF_ID = process.env.LIFF_ID;

if (!CHANNEL_ACCESS_TOKEN) {
  console.error('❌ Error: CHANNEL_ACCESS_TOKEN is missing in .env');
  process.exit(1);
}

if (!LIFF_ID) {
  console.error('❌ Error: LIFF_ID is missing in .env. We need it to construct the LIFF redirect URLs.');
  process.exit(1);
}

const LIFF_URL = `https://miniapp.line.me/${LIFF_ID}`;

// 1. Define the Rich Menu structure (6 slots, 3x2 grid)
// Width: 2500, Height: 1686
const richMenuConfig = {
  size: {
    width: 2500,
    height: 1686
  },
  selected: true,
  name: "Minecraft Pixel Shop Menu",
  chatBarText: "Shop & Book",
  areas: [
    {
      // Slot 1: Shop Items (Top-Left)
      bounds: { x: 0, y: 0, width: 833, height: 843 },
      action: {
        type: "uri",
        uri: `${LIFF_URL}#shop`,
        label: "Shop Items"
      }
    },
    {
      // Slot 2: Book Slot (Top-Middle)
      bounds: { x: 833, y: 0, width: 834, height: 843 },
      action: {
        type: "uri",
        uri: `${LIFF_URL}#book`,
        label: "Book Slot"
      }
    },
    {
      // Slot 3: Check Queue (Top-Right)
      bounds: { x: 1667, y: 0, width: 833, height: 843 },
      action: {
        type: "uri",
        uri: `${LIFF_URL}#queue`,
        label: "Check Queue"
      }
    },
    {
      // Slot 4: Invite Friends / Share (Bottom-Left)
      bounds: { x: 0, y: 843, width: 833, height: 843 },
      action: {
        type: "uri",
        uri: `${LIFF_URL}#share`,
        label: "Share Shop"
      }
    },
    {
      // Slot 5: Help & Info (Bottom-Middle)
      bounds: { x: 833, y: 843, width: 834, height: 843 },
      action: {
        type: "message",
        text: "ช่วยเหลือ",
        label: "Help"
      }
    },
    {
      // Slot 6: AI Chat (Bottom-Right)
      bounds: { x: 1667, y: 843, width: 833, height: 843 },
      action: {
        type: "message",
        text: "ถาม วิธีจองคิวคืออะไร?",
        label: "AI Chat"
      }
    }
  ]
};

async function run() {
  try {
    console.log('🚀 Starting Rich Menu Registration...');

    // Step 1: Create Rich Menu Metadata
    const createRes = await fetch('https://api.line.me/v2/bot/richmenu', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CHANNEL_ACCESS_TOKEN}`
      },
      body: JSON.stringify(richMenuConfig)
    });

    const createData = await createRes.json();
    if (!createRes.ok) {
      throw new Error(`Failed to create rich menu: ${JSON.stringify(createData)}`);
    }

    const richMenuId = createData.richMenuId;
    console.log(`✅ Rich Menu created. ID: ${richMenuId}`);

    // Step 2: Upload Background Image
    const imagePath = path.join(__dirname, 'rich_menu_background.jpg');
    if (!fs.existsSync(imagePath)) {
      throw new Error(`Image file not found at ${imagePath}. Run generate_image first or add an image there.`);
    }

    const imageBuffer = fs.readFileSync(imagePath);
    console.log('📤 Uploading background image...');
    
    const uploadRes = await fetch(`https://api-data.line.me/v2/bot/richmenu/${richMenuId}/content`, {
      method: 'POST',
      headers: {
        'Content-Type': 'image/jpeg',
        'Authorization': `Bearer ${CHANNEL_ACCESS_TOKEN}`
      },
      body: imageBuffer
    });

    if (!uploadRes.ok) {
      const uploadData = await uploadRes.json().catch(() => ({}));
      throw new Error(`Failed to upload rich menu image: ${JSON.stringify(uploadData)}`);
    }
    console.log('✅ Background image uploaded successfully!');

    // Step 3: Link Rich Menu as Default
    console.log('🔗 Setting rich menu as the default for all users...');
    const linkRes = await fetch(`https://api.line.me/v2/bot/user/all/richmenu/${richMenuId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CHANNEL_ACCESS_TOKEN}`
      }
    });

    if (!linkRes.ok) {
      const linkData = await linkRes.json().catch(() => ({}));
      throw new Error(`Failed to set rich menu default: ${JSON.stringify(linkData)}`);
    }

    console.log(`🎉 Success! Rich Menu is now active as default for your LINE OA channel.`);
  } catch (error) {
    console.error('❌ Script failed:', error.message);
  }
}

run();
