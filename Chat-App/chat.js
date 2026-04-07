// ── Gun.js setup — uses public relay peers, zero registration ────────────────
const gun = Gun([
  'https://gun-manhattan.herokuapp.com/gun',
  'https://gun-us.herokuapp.com/gun',
  'https://gunjs.herokuapp.com/gun'
]);

const messages  = gun.get('livechat-messages-v1');
const presence  = gun.get('livechat-presence-v1');
const typing    = gun.get('livechat-typing-v1');

// ── State ─────────────────────────────────────────────────────────────────────
let userName    = '';
let userColor   = '';
let userKey     = '';
let typingTimer = null;
let seenIds     = new Set();
let onlineUsers = {};

const COLORS = [
  '#6c63ff','#a78bfa','#34d399','#f59e0b',
  '#f87171','#38bdf8','#fb7185','#4ade80'
];

function randomColor() {
  return COLORS[Math.floor(Math.random() * COLORS.length)];
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatTime(ts) {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// ── DOM refs ──────────────────────────────────────────────────────────────────
const joinScreen = document.getElementById('join-screen');
const chatScreen = document.getElementById('chat-screen');
const nameInput  = document.getElementById('name-input');
const joinBtn    = document.getElementById('join-btn');
const joinError  = document.getElementById('join-error');
const messagesEl = document.getElementById('messages');
const msgForm    = document.getElementById('msg-form');
const msgInput   = document.getElementById('msg-input');
const leaveBtn   = document.getElementById('leave-btn');
const onlineNum  = document.getElementById('online-num');
const typingText = document.getElementById('typing-text');

// ── Join ──────────────────────────────────────────────────────────────────────
nameInput.addEventListener('keydown', e => { if (e.key === 'Enter') joinChat(); });
joinBtn.addEventListener('click', joinChat);

function joinChat() {
  const name = nameInput.value.trim();
  if (!name)          { joinError.textContent = 'Please enter your name.'; return; }
  if (name.length < 2){ joinError.textContent = 'Name must be at least 2 characters.'; return; }

  userName  = escapeHtml(name);
  userColor = randomColor();
  userKey   = uid();

  joinScreen.classList.add('hidden');
  chatScreen.classList.remove('hidden');
  msgInput.focus();

  setupPresence();
  listenMessages();
  listenTyping();
  listenOnlineCount();
  sendSystemMessage(userName + ' joined the chat');
}

// ── Leave ─────────────────────────────────────────────────────────────────────
leaveBtn.addEventListener('click', leaveChat);
window.addEventListener('beforeunload', leaveChat);

function leaveChat() {
  if (!userName) return;
  sendSystemMessage(userName + ' left the chat');
  presence.get(userKey).put(null);
  typing.get(userKey).put(null);
  userName = '';
  chatScreen.classList.add('hidden');
  joinScreen.classList.remove('hidden');
  messagesEl.innerHTML = '';
  nameInput.value = '';
}

// ── Presence ──────────────────────────────────────────────────────────────────
function setupPresence() {
  presence.get(userKey).put({ name: userName, ts: Date.now() });

  // Heartbeat every 20s so others know we're still here
  setInterval(() => {
    if (userName) presence.get(userKey).put({ name: userName, ts: Date.now() });
  }, 20000);
}

function listenOnlineCount() {
  presence.map().on((data, key) => {
    if (!data || !data.name) {
      delete onlineUsers[key];
    } else if (Date.now() - data.ts < 60000) {
      onlineUsers[key] = data.name;
    } else {
      delete onlineUsers[key];
    }
    onlineNum.textContent = Math.max(1, Object.keys(onlineUsers).length);
  });
}

// ── Messages ──────────────────────────────────────────────────────────────────
function listenMessages() {
  messages.map().on((msg, id) => {
    if (!msg || !msg.ts || seenIds.has(id)) return;
    seenIds.add(id);

    // Only show messages from last 24 hours
    if (Date.now() - msg.ts > 86400000) return;

    renderMessage(msg);
  });
}

function renderMessage(msg) {
  if (msg.type === 'system') {
    const el = document.createElement('div');
    el.className = 'msg-system';
    el.textContent = msg.text;
    messagesEl.appendChild(el);
  } else {
    const isMe = msg.name === userName;
    const row  = document.createElement('div');
    row.className = 'msg-row ' + (isMe ? 'me' : 'other');
    row.innerHTML =
      (!isMe ? '<div class="msg-name" style="color:' + msg.color + '">' + escapeHtml(msg.name) + '</div>' : '') +
      '<div class="msg-bubble">' + escapeHtml(msg.text) + '</div>' +
      '<div class="msg-time">' + formatTime(msg.ts) + '</div>';
    messagesEl.appendChild(row);
  }
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

function sendSystemMessage(text) {
  messages.get(uid()).put({ type: 'system', text: text, ts: Date.now() });
}

// ── Send message ──────────────────────────────────────────────────────────────
msgForm.addEventListener('submit', e => {
  e.preventDefault();
  const text = msgInput.value.trim();
  if (!text || !userName) return;

  messages.get(uid()).put({
    type:  'user',
    name:  userName,
    color: userColor,
    text:  text,
    ts:    Date.now()
  });

  msgInput.value = '';
  clearTypingIndicator();
});

// ── Typing indicator ──────────────────────────────────────────────────────────
msgInput.addEventListener('input', () => {
  if (!userName) return;
  typing.get(userKey).put({ name: userName, ts: Date.now() });
  clearTimeout(typingTimer);
  typingTimer = setTimeout(clearTypingIndicator, 3000);
});

function clearTypingIndicator() {
  if (userName) typing.get(userKey).put(null);
  clearTimeout(typingTimer);
}

function listenTyping() {
  typing.map().on((data, key) => {
    if (key === userKey) return;
    const typers = [];
    typing.map().once((d, k) => {
      if (d && d.name && k !== userKey && Date.now() - d.ts < 4000) {
        typers.push(d.name);
      }
    });
    if (typers.length === 0)      typingText.textContent = '';
    else if (typers.length === 1) typingText.textContent = typers[0] + ' is typing...';
    else                          typingText.textContent = typers.join(', ') + ' are typing...';
  });
}
