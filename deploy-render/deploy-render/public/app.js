// app.js - Frontend application code for LINE LIFF Final Exam

// DOM Elements
const userAvatar = document.getElementById('user-avatar');
const userDisplayName = document.getElementById('user-display-name');
const liffStatus = document.getElementById('liff-status');

const studentIdInput = document.getElementById('student-id');
const studentCourseInput = document.getElementById('student-course');
const btnSendCard = document.getElementById('btn-send-card');

const btnShareCoach = document.getElementById('btn-share-coach');

const btnScanQr = document.getElementById('btn-scan-qr');
const scanResultWrapper = document.getElementById('scan-result-wrapper');
const scanResultText = document.getElementById('scan-result-text');
const btnCopyResult = document.getElementById('btn-copy-result');
const btnSendResultChat = document.getElementById('btn-send-result-chat');

let currentUser = null;
let scanValue = '';

// ----------------------------------------------------
// 1. Initialization and LIFF Connection
// ----------------------------------------------------
async function init() {
  const liffId = window.LIFF_CONFIG?.liffId;

  if (!liffId) {
    setStatus('ข้อผิดพลาด: ไม่พบ LIFF ID ใน config.js', true);
    return;
  }

  try {
    // Initialize LIFF
    await liff.init({ liffId });
    setStatus('เชื่อมต่อ LINE สำเร็จ');

    // Force Login if not logged in
    if (!liff.isLoggedIn()) {
      liff.login();
      return;
    }

    // 3.1 Fetch user profile
    const profile = await liff.getProfile();
    currentUser = profile;

    // Display profile details on UI
    userAvatar.src = profile.pictureUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=250';
    userDisplayName.textContent = profile.displayName;

  } catch (err) {
    console.error('LIFF initialization failed:', err);
    setStatus(`เกิดข้อผิดพลาด: ${err.message}`, true);
  }
}

function setStatus(message, isError = false) {
  liffStatus.textContent = message;
  if (isError) {
    liffStatus.style.background = 'rgba(239, 68, 68, 0.2)';
    liffStatus.style.color = '#ef4444';
  } else {
    liffStatus.style.background = 'rgba(16, 185, 129, 0.2)';
    liffStatus.style.color = '#10b981';
  }
}

// ----------------------------------------------------
// 2. 3.2 Send My Card into Chat (liff.sendMessages())
// ----------------------------------------------------
btnSendCard.addEventListener('click', async () => {
  if (!currentUser) {
    alert('ยังไม่ได้โหลดข้อมูลโปรไฟล์ กรุณารอสักครู่');
    return;
  }

  const studentId = studentIdInput.value.trim();
  const studentCourse = studentCourseInput.value.trim();

  if (!studentId || !studentCourse) {
    alert('กรุณากรอกรหัสนักศึกษาและหลักสูตรให้ครบถ้วน');
    return;
  }

  if (!liff.isInClient()) {
    alert('ฟังก์ชัน sendMessages() สามารถใช้งานได้เมื่อเปิดแอปผ่านห้องแชทใน LINE เท่านั้น');
    return;
  }

  btnSendCard.disabled = true;
  btnSendCard.innerHTML = 'กำลังส่งนามบัตร...';

  const myCardFlex = {
    type: 'flex',
    altText: `นามบัตรของ ${currentUser.displayName}`,
    contents: {
      type: 'bubble',
      size: 'giga',
      styles: {
        header: { backgroundColor: '#1e293b' },
        body: { backgroundColor: '#0f172a' },
        footer: { backgroundColor: '#1e293b' }
      },
      header: {
        type: 'box',
        layout: 'vertical',
        align: 'center',
        contents: [
          {
            type: 'text',
            text: 'DIGITAL BUSINESS CARD',
            color: '#38bdf8',
            weight: 'bold',
            size: 'sm',
            align: 'center'
          }
        ]
      },
      hero: {
        type: 'image',
        url: currentUser.pictureUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=250',
        size: 'full',
        aspectRatio: '1:1',
        aspectMode: 'cover'
      },
      body: {
        type: 'box',
        layout: 'vertical',
        spacing: 'md',
        contents: [
          {
            type: 'text',
            text: currentUser.displayName,
            color: '#ffffff',
            weight: 'bold',
            size: 'xl',
            align: 'center'
          },
          {
            type: 'text',
            text: 'Student Profile',
            color: '#94a3b8',
            size: 'xs',
            align: 'center'
          },
          {
            type: 'separator',
            color: '#334155',
            margin: 'sm'
          },
          {
            type: 'box',
            layout: 'vertical',
            spacing: 'sm',
            margin: 'md',
            contents: [
              {
                type: 'box',
                layout: 'horizontal',
                contents: [
                  {
                    type: 'text',
                    text: 'รหัสนักศึกษา:',
                    color: '#94a3b8',
                    size: 'sm',
                    flex: 2
                  },
                  {
                    type: 'text',
                    text: studentId,
                    color: '#f1f5f9',
                    size: 'sm',
                    weight: 'bold',
                    flex: 3
                  }
                ]
              },
              {
                type: 'box',
                layout: 'horizontal',
                contents: [
                  {
                    type: 'text',
                    text: 'หลักสูตร:',
                    color: '#94a3b8',
                    size: 'sm',
                    flex: 2
                  },
                  {
                    type: 'text',
                    text: studentCourse,
                    color: '#f1f5f9',
                    size: 'sm',
                    weight: 'bold',
                    flex: 3,
                    wrap: true
                  }
                ]
              }
            ]
          }
        ]
      }
    }
  };

  try {
    await liff.sendMessages([myCardFlex]);
    alert('ส่งนามบัตรของคุณเข้าไปในห้องแชทเรียบร้อยแล้ว!');
  } catch (err) {
    console.error('sendMessages failed:', err);
    alert(`ส่งนามบัตรล้มเหลว: ${err.message}`);
  } finally {
    btnSendCard.disabled = false;
    btnSendCard.innerHTML = '<span class="btn-icon">📤</span> ส่งนามบัตรเข้าห้องแชท (Send My Card)';
  }
});

// ----------------------------------------------------
// 3. 3.3 Share Coach Card to Friends (liff.shareTargetPicker())
// ----------------------------------------------------
btnShareCoach.addEventListener('click', async () => {
  if (!liff.isApiAvailable('shareTargetPicker')) {
    alert('การแชร์นามบัตร (shareTargetPicker) ไม่รองรับเมื่อเปิดบนบราวเซอร์ทั่วไปภายนอก LINE');
    return;
  }

  btnShareCoach.disabled = true;
  btnShareCoach.innerHTML = 'กำลังเปิดหน้ารายการเพื่อน...';

  const coachCardFlex = {
    type: 'flex',
    altText: 'นามบัตร อาจารย์ วุฒิพงษ์ ชินศรี',
    contents: {
      type: 'bubble',
      size: 'giga',
      styles: {
        header: { backgroundColor: '#312e81' },
        body: { backgroundColor: '#1e1b4b' },
        footer: { backgroundColor: '#312e81' }
      },
      header: {
        type: 'box',
        layout: 'vertical',
        align: 'center',
        contents: [
          {
            type: 'text',
            text: 'COACH BUSINESS CARD',
            color: '#818cf8',
            weight: 'bold',
            size: 'sm',
            align: 'center'
          }
        ]
      },
      hero: {
        type: 'image',
        url: 'https://wutthipong.info/image/RSUDIT.png',
        size: 'full',
        aspectRatio: '1:1',
        aspectMode: 'cover'
      },
      body: {
        type: 'box',
        layout: 'vertical',
        spacing: 'md',
        contents: [
          {
            type: 'text',
            text: 'วุฒิพงษ์ ชินศรี',
            color: '#ffffff',
            weight: 'bold',
            size: 'xl',
            align: 'center'
          },
          {
            type: 'text',
            text: 'อาจารย์ ม.รังสิต',
            color: '#c7d2fe',
            size: 'sm',
            align: 'center'
          }
        ]
      },
      footer: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'button',
            style: 'primary',
            color: '#4f46e5',
            action: {
              type: 'uri',
              label: 'Website',
              uri: 'https://wutthipong.info'
            }
          }
        ]
      }
    }
  };

  try {
    const result = await liff.shareTargetPicker([coachCardFlex]);
    if (result) {
      alert('แชร์นามบัตรของ อ.เณร ให้เพื่อนสำเร็จแล้ว!');
    } else {
      console.log('ShareTargetPicker cancelled by user.');
    }
  } catch (err) {
    console.error('shareTargetPicker failed:', err);
    alert(`แชร์นามบัตรล้มเหลว: ${err.message}`);
  } finally {
    btnShareCoach.disabled = false;
    btnShareCoach.innerHTML = '<span class="btn-icon">🔗</span> แชร์ให้เพื่อนใน LINE (Share Coach Card)';
  }
});

// ----------------------------------------------------
// 4. 3.4 QR Code Scanner (liff.scanCodeV2())
// ----------------------------------------------------
btnScanQr.addEventListener('click', async () => {
  // Check if feature is available
  if (!liff.isApiAvailable('scanCodeV2')) {
    alert('การสแกน QR Code (scanCodeV2) รองรับเฉพาะการใช้งานในแอปพลิเคชัน LINE บนมือถือเท่านั้น');
    return;
  }

  try {
    const result = await liff.scanCodeV2();
    scanValue = result.value || '';
    
    if (scanValue) {
      scanResultText.textContent = scanValue;
      scanResultWrapper.classList.remove('hidden');
      
      // Auto-scroll to view the result
      scanResultWrapper.scrollIntoView({ behavior: 'smooth' });
    }
  } catch (err) {
    console.error('QR scanning failed:', err);
    alert(`การสแกนผิดพลาด: ${err.message || 'ผู้ใช้งานยกเลิกการสแกน'}`);
  }
});

// Copy result helper
btnCopyResult.addEventListener('click', () => {
  if (!scanValue) return;
  navigator.clipboard.writeText(scanValue)
    .then(() => {
      alert('คัดลอกลิงก์/ข้อความสำเร็จ!');
    })
    .catch(err => {
      console.error('Copy failed:', err);
      alert('ไม่สามารถคัดลอกข้อความได้อัตโนมัติ');
    });
});

// Send result back to chat helper
btnSendResultChat.addEventListener('click', async () => {
  if (!scanValue) return;

  if (!liff.isInClient()) {
    alert('คุณลักษณะนี้ใช้งานได้เมื่อเปิดแอปผ่านห้องแชท LINE เท่านั้น');
    return;
  }

  btnSendResultChat.disabled = true;
  btnSendResultChat.textContent = 'กำลังส่งข้อความ...';

  try {
    await liff.sendMessages([
      {
        type: 'text',
        text: `ผลสแกน QR Code: ${scanValue}`
      }
    ]);
    alert('ส่งผลลัพธ์เข้าห้องแชทแล้ว!');
  } catch (err) {
    console.error('Failed to send scan result to chat:', err);
    alert(`ส่งข้อความไม่สำเร็จ: ${err.message}`);
  } finally {
    btnSendResultChat.disabled = false;
    btnSendResultChat.textContent = 'ส่งเข้าห้องแชท';
  }
});

// Start LIFF
document.addEventListener('DOMContentLoaded', init);
