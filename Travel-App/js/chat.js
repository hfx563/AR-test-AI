// ArLux Group Chat - Real-time messaging
let chatUsername = '';
let chatMessages = [];
let isPolling = false;
let pollInterval = null;
let lastMessageId = null;
let isFloatingChatOpen = false;

const CHAT_API_URL = 'https://api.jsonbin.io/v3/b/679d8e3ead19ca34f8e7c123';
const API_KEY = '$2a$10$vZ8qN5xK3mH9pL2wR4tY6eX1cF7bG9hJ5kM3nP8qS2vT4wU6yA0zO';
const POLL_INTERVAL = 3000;

function initChat() {
    // Modal chat
    document.getElementById('toggleChatBtn').addEventListener('click', openChat);
    document.getElementById('closeChatBtn').addEventListener('click', closeChat);
    document.getElementById('chatModalOverlay').addEventListener('click', closeChat);
    document.getElementById('sendMessageBtn').addEventListener('click', sendMessage);
    document.getElementById('changeUsernameBtn').addEventListener('click', changeUsername);
    
    document.getElementById('chatInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
    
    // Floating chat
    document.getElementById('floatingChatBtn').addEventListener('click', toggleFloatingChat);
    document.getElementById('minimizeChatBtn').addEventListener('click', toggleFloatingChat);
    document.getElementById('floatingSendBtn').addEventListener('click', sendFloatingMessage);
    document.getElementById('floatingChangeUsername').addEventListener('click', changeUsername);
    
    document.getElementById('floatingChatInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendFloatingMessage();
        }
    });
}

function openChat() {
    chatUsername = localStorage.getItem('arlux-username');
    if (!chatUsername) {
        chatUsername = prompt('Enter your name:');
        if (!chatUsername || chatUsername.trim() === '') {
            chatUsername = 'User' + Math.floor(Math.random() * 9999);
        }
        chatUsername = chatUsername.trim();
        localStorage.setItem('arlux-username', chatUsername);
    }
    
    document.getElementById('currentUsername').textContent = chatUsername;
    document.getElementById('chatModal').style.display = 'flex';
    
    loadMessages();
    
    if (!isPolling) {
        isPolling = true;
        pollInterval = setInterval(loadMessages, POLL_INTERVAL);
    }
}

function closeChat() {
    document.getElementById('chatModal').style.display = 'none';
    if (pollInterval) {
        clearInterval(pollInterval);
        pollInterval = null;
        isPolling = false;
    }
}

function changeUsername() {
    const newName = prompt('Enter new username:', chatUsername);
    if (newName && newName.trim() !== '') {
        const oldName = chatUsername;
        chatUsername = newName.trim();
        localStorage.setItem('arlux-username', chatUsername);
        document.getElementById('currentUsername').textContent = chatUsername;
        document.getElementById('floatingUsername').textContent = chatUsername;
        
        const systemMsg = {
            id: Date.now() + '-' + Math.random().toString(36).substr(2, 9),
            username: 'System',
            text: `${oldName} is now ${chatUsername}`,
            time: Date.now(),
            isSystem: true
        };
        
        chatMessages.push(systemMsg);
        saveMessages();
    }
}

function toggleFloatingChat() {
    isFloatingChatOpen = !isFloatingChatOpen;
    const window = document.getElementById('floatingChatWindow');
    
    if (isFloatingChatOpen) {
        chatUsername = localStorage.getItem('arlux-username');
        if (!chatUsername) {
            chatUsername = prompt('Enter your name:');
            if (!chatUsername || chatUsername.trim() === '') {
                chatUsername = 'User' + Math.floor(Math.random() * 9999);
            }
            chatUsername = chatUsername.trim();
            localStorage.setItem('arlux-username', chatUsername);
        }
        
        document.getElementById('floatingUsername').textContent = chatUsername;
        window.style.display = 'flex';
        
        loadMessages();
        
        if (!isPolling) {
            isPolling = true;
            pollInterval = setInterval(loadMessages, POLL_INTERVAL);
        }
    } else {
        window.style.display = 'none';
    }
}

function sendFloatingMessage() {
    const input = document.getElementById('floatingChatInput');
    const text = input.value.trim();
    
    if (!text) return;
    
    input.value = '';
    
    const msg = {
        id: Date.now() + '-' + Math.random().toString(36).substr(2, 9),
        username: chatUsername,
        text: text,
        time: Date.now()
    };
    
    chatMessages.push(msg);
    
    if (chatMessages.length > 100) {
        chatMessages = chatMessages.slice(-100);
    }
    
    renderFloatingMessages(true);
    saveMessages();
}

function loadMessages() {
    fetch(CHAT_API_URL + '/latest', {
        headers: { 'X-Master-Key': API_KEY }
    })
    .then(res => res.json())
    .then(data => {
        if (data && data.record && data.record.messages) {
            chatMessages = data.record.messages;
            renderMessages();
            renderFloatingMessages();
        } else {
            chatMessages = [];
            showEmpty();
        }
    })
    .catch(err => {
        console.log('Load failed:', err);
        showEmpty();
    });
}

function sendMessage() {
    const input = document.getElementById('chatInput');
    const text = input.value.trim();
    
    if (!text) return;
    
    input.value = '';
    
    const msg = {
        id: Date.now() + '-' + Math.random().toString(36).substr(2, 9),
        username: chatUsername,
        text: text,
        time: Date.now()
    };
    
    chatMessages.push(msg);
    
    if (chatMessages.length > 100) {
        chatMessages = chatMessages.slice(-100);
    }
    
    renderMessages(true);
    saveMessages();
}

function saveMessages() {
    fetch(CHAT_API_URL, {
        method: 'PUT',
        headers: { 
            'Content-Type': 'application/json',
            'X-Master-Key': API_KEY
        },
        body: JSON.stringify({ messages: chatMessages })
    })
    .then(res => {
        if (res.ok) {
            console.log('✅ Synced');
            setTimeout(loadMessages, 500);
        }
    })
    .catch(err => console.log('Save failed:', err));
}

function renderMessages(scroll = false) {
    const container = document.getElementById('chatMessages');
    
    if (!chatMessages || chatMessages.length === 0) {
        showEmpty();
        return;
    }
    
    const wasBottom = container.scrollHeight - container.scrollTop <= container.clientHeight + 50;
    
    container.innerHTML = '';
    
    chatMessages.slice(-50).forEach(msg => {
        const div = document.createElement('div');
        
        if (msg.isSystem) {
            div.className = 'chat-system-message';
            div.textContent = msg.text;
        } else {
            div.className = 'chat-message' + (msg.username === chatUsername ? ' own' : '');
            
            const time = new Date(msg.time).toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit' 
            });
            
            div.innerHTML = `
                <div class="chat-message-header">
                    <span class="chat-username">${escapeHtml(msg.username)}</span>
                    <span class="chat-time">${time}</span>
                </div>
                <div class="chat-message-text">${escapeHtml(msg.text)}</div>
            `;
        }
        
        container.appendChild(div);
    });
    
    if (wasBottom || scroll) {
        setTimeout(() => container.scrollTop = container.scrollHeight, 50);
    }
}

function showEmpty() {
    const container = document.getElementById('chatMessages');
    container.innerHTML = '<div class="chat-system-message">No messages yet. Say hello! 👋</div>';
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function renderFloatingMessages(scroll = false) {
    const container = document.getElementById('floatingChatMessages');
    
    if (!chatMessages || chatMessages.length === 0) {
        container.innerHTML = '<div class="chat-system-message">No messages yet. Say hello! 👋</div>';
        return;
    }
    
    const wasBottom = container.scrollHeight - container.scrollTop <= container.clientHeight + 50;
    
    container.innerHTML = '';
    
    chatMessages.slice(-50).forEach(msg => {
        const div = document.createElement('div');
        
        if (msg.isSystem) {
            div.className = 'chat-system-message';
            div.textContent = msg.text;
        } else {
            div.className = 'chat-message' + (msg.username === chatUsername ? ' own' : '');
            
            const time = new Date(msg.time).toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit' 
            });
            
            div.innerHTML = `
                <div class="chat-message-header">
                    <span class="chat-username">${escapeHtml(msg.username)}</span>
                    <span class="chat-time">${time}</span>
                </div>
                <div class="chat-message-text">${escapeHtml(msg.text)}</div>
            `;
        }
        
        container.appendChild(div);
    });
    
    if (wasBottom || scroll) {
        setTimeout(() => container.scrollTop = container.scrollHeight, 50);
    }
}
