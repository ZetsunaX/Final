/**
 * pixelFlex.js - Retro Pixel-Art / Minecraft Themed Flex Messages
 */

/**
 * Creates a pixel-art style Flex Message for Queue Confirmation
 * @param {Object} queue - The queue data { queueNumber, username, slot, date, status }
 */
export function createQueueFlex(queue) {
  const slotText = queue.slot === 'Morning' ? 'Morning (09:00 - 13:30)' : 'Afternoon (13:30 - 18:00)';
  
  return {
    type: 'flex',
    altText: `Queue Confirmed: ${queue.queueNumber}`,
    contents: {
      type: 'bubble',
      styles: {
        header: { backgroundColor: '#111111' },
        body: { backgroundColor: '#181818' },
        footer: { backgroundColor: '#111111' }
      },
      header: {
        type: 'box',
        layout: 'vertical',
        borderColor: '#E6C300',
        borderWidth: 'semi-bold',
        paddingAll: 'md',
        contents: [
          {
            type: 'text',
            text: '■ QUEUE BOOKED ■',
            color: '#E6C300',
            weight: 'bold',
            size: 'md',
            align: 'center',
            style: 'normal'
          }
        ]
      },
      body: {
        type: 'box',
        layout: 'vertical',
        spacing: 'md',
        borderColor: '#E6C300',
        borderWidth: 'semi-bold',
        paddingAll: 'lg',
        contents: [
          {
            type: 'text',
            text: queue.queueNumber,
            color: '#55FF55',
            weight: 'bold',
            size: '3xl',
            align: 'center'
          },
          {
            type: 'text',
            text: `STATUS: ${queue.status.toUpperCase()}`,
            color: '#FFAA00',
            weight: 'bold',
            size: 'xs',
            align: 'center'
          },
          {
            type: 'separator',
            color: '#E6C300'
          },
          {
            type: 'box',
            layout: 'vertical',
            spacing: 'sm',
            contents: [
              {
                type: 'box',
                layout: 'horizontal',
                contents: [
                  {
                    type: 'text',
                    text: '> USERNAME:',
                    color: '#AAAAAA',
                    size: 'xs',
                    flex: 4
                  },
                  {
                    type: 'text',
                    text: queue.username,
                    color: '#FFFFFF',
                    size: 'xs',
                    weight: 'bold',
                    flex: 8
                  }
                ]
              },
              {
                type: 'box',
                layout: 'horizontal',
                contents: [
                  {
                    type: 'text',
                    text: '> SLOT:',
                    color: '#AAAAAA',
                    size: 'xs',
                    flex: 4
                  },
                  {
                    type: 'text',
                    text: slotText,
                    color: '#FFFFFF',
                    size: 'xs',
                    weight: 'bold',
                    flex: 8
                  }
                ]
              },
              {
                type: 'box',
                layout: 'horizontal',
                contents: [
                  {
                    type: 'text',
                    text: '> DATE:',
                    color: '#AAAAAA',
                    size: 'xs',
                    flex: 4
                  },
                  {
                    type: 'text',
                    text: queue.date,
                    color: '#FFFFFF',
                    size: 'xs',
                    weight: 'bold',
                    flex: 8
                  }
                ]
              }
            ]
          }
        ]
      },
      footer: {
        type: 'box',
        layout: 'vertical',
        borderColor: '#E6C300',
        borderWidth: 'semi-bold',
        paddingAll: 'md',
        contents: [
          {
            type: 'text',
            text: 'Please check details in LIFF app',
            color: '#888888',
            size: 'xxs',
            align: 'center',
            margin: 'xs'
          }
        ]
      }
    }
  };
}

/**
 * Creates a pixel-art style Flex Message for Order confirmation
 * @param {Object} order - The order data { orderId, username, items, totalPrice, paymentStatus }
 */
export function createOrderFlex(order) {
  const itemsBox = order.items.map(item => ({
    type: 'box',
    layout: 'horizontal',
    contents: [
      {
        type: 'text',
        text: `x${item.count} ${item.name}`,
        color: '#FFFFFF',
        size: 'xs',
        flex: 8
      },
      {
        type: 'text',
        text: `฿${item.price * item.count}`,
        color: '#55FF55',
        size: 'xs',
        align: 'end',
        flex: 4
      }
    ]
  }));

  return {
    type: 'flex',
    altText: `Order Placed: ${order.orderId}`,
    contents: {
      type: 'bubble',
      styles: {
        header: { backgroundColor: '#111111' },
        body: { backgroundColor: '#181818' },
        footer: { backgroundColor: '#111111' }
      },
      header: {
        type: 'box',
        layout: 'vertical',
        borderColor: '#E6C300',
        borderWidth: 'semi-bold',
        paddingAll: 'md',
        contents: [
          {
            type: 'text',
            text: '■ ORDER RECEIVED ■',
            color: '#E6C300',
            weight: 'bold',
            size: 'md',
            align: 'center'
          }
        ]
      },
      body: {
        type: 'box',
        layout: 'vertical',
        spacing: 'md',
        borderColor: '#E6C300',
        borderWidth: 'semi-bold',
        paddingAll: 'lg',
        contents: [
          {
            type: 'text',
            text: order.orderId,
            color: '#FFAA00',
            weight: 'bold',
            size: 'md',
            align: 'center'
          },
          {
            type: 'text',
            text: `PAYMENT: ${order.paymentStatus.toUpperCase()}`,
            color: order.paymentStatus === 'verified' ? '#55FF55' : '#FF5555',
            weight: 'bold',
            size: 'xs',
            align: 'center'
          },
          {
            type: 'separator',
            color: '#E6C300'
          },
          {
            type: 'box',
            layout: 'vertical',
            spacing: 'sm',
            contents: [
              {
                type: 'text',
                text: 'ITEMS ORDERED:',
                color: '#AAAAAA',
                size: 'xs',
                weight: 'bold'
              },
              ...itemsBox,
              {
                type: 'separator',
                color: '#333333',
                margin: 'sm'
              },
              {
                type: 'box',
                layout: 'horizontal',
                contents: [
                  {
                    type: 'text',
                    text: 'TOTAL PRICE:',
                    color: '#AAAAAA',
                    size: 'xs',
                    weight: 'bold',
                    flex: 8
                  },
                  {
                    type: 'text',
                    text: `฿${order.totalPrice}`,
                    color: '#55FF55',
                    size: 'sm',
                    weight: 'bold',
                    align: 'end',
                    flex: 4
                  }
                ]
              }
            ]
          }
        ]
      },
      footer: {
        type: 'box',
        layout: 'vertical',
        borderColor: '#E6C300',
        borderWidth: 'semi-bold',
        paddingAll: 'md',
        contents: [
          {
            type: 'text',
            text: 'Submit your slip in the LIFF app to complete purchase',
            color: '#888888',
            size: 'xxs',
            align: 'center',
            margin: 'xs',
            wrap: true
          }
        ]
      }
    }
  };
}
