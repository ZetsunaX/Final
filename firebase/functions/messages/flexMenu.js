/**
 * Flex Message template — การ์ดแสดงสินค้า
 */
export function createProductCard() {
  return {
    type: 'flex',
    altText: 'สินค้าแนะนำ',
    contents: {
      type: 'bubble',
      hero: {
        type: 'image',
        url: 'https://developers-resource.landpress.line.me/fx/img/01_1_cafe.png',
        size: 'full',
        aspectRatio: '20:13',
        aspectMode: 'cover',
      },
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: 'กาแฟลาเต้',
            weight: 'bold',
            size: 'xl',
          },
          {
            type: 'box',
            layout: 'baseline',
            margin: 'md',
            contents: [
              {
                type: 'text',
                text: '฿65',
                size: 'lg',
                color: '#1DB446',
                weight: 'bold',
              },
              {
                type: 'text',
                text: '/ แก้ว',
                size: 'sm',
                color: '#aaaaaa',
                margin: 'sm',
              },
            ],
          },
          {
            type: 'text',
            text: 'กาแฟรสนุ่ม หอมละมุน เหมาะสำหรับทุกช่วงเวลา',
            size: 'sm',
            color: '#666666',
            margin: 'md',
            wrap: true,
          },
        ],
      },
      footer: {
        type: 'box',
        layout: 'vertical',
        spacing: 'sm',
        contents: [
          {
            type: 'button',
            style: 'primary',
            action: {
              type: 'postback',
              label: 'สั่งซื้อ',
              data: 'action=order&item=latte',
              displayText: 'สั่งกาแฟลาเต้',
            },
          },
        ],
      },
    },
  };
}
