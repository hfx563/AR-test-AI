// Group Chat Module
let chatUsername = '';
let lastMessageId = 0;
let messagePolling = null;
let isInitialized = false;

function initializeChat() {
    // Only initialize once per session
    if (isInitialized) {
        return;
    }
    isInitialized = true;
    
    chatUsername = localStorage.getItem('chatUsername');
    if (!chatUsername) {
        chatUsername = prompt('Enter your name for chat:') || 'Traveler' + Math.floor(Math.random() * 1000);
        localStorage.setItem('chatUsername', chatUsername);
    }
    
    // Load messages immediately
    loadMessages();
    
    // Clear any existing polling
    if (messagePolling) {
        clearInterval(messagePolling);
    }
    
    // Start polling for new messages
    messagePolling = setInterval(loadMessages, 2000);
}

function loadMessages() {
    fetch(`https://api.allorigins.win/raw?url=https://jsonkeeper.com/b/LUXE_CHAT`)
        .then(response => response.json())
        .then(data => {
            const messages = data.messages || [];
            displayMessages(messages, false);
        })
        .catch(error => {
            console.error('Error loading messages:', error);
            const messages = JSON.parse(localStorage.getItem('luxe-chat-backup') || '[]');
            displayMessages(messages, false);
        });
}

function displayMessages(messages, forceScroll = false) {
    const chatMessages = document.getElementById('chatMessages');
    
    if (messages.length === 0) {
        chatMessages.innerHTML = '<div class="chat-system-message">No messages yet. Be the first to say hello!</div>';
        lastMessageId = 0;
        return;
    }
    
    // Get the latest message ID
    const latestMessageId = messages[messages.length - 1].id;
    
    // Only update if there are actually new messages
    if (latestMessageId === lastMessageId && !forceScroll) {
        return; // No new messages, don't update
    }
    
    // Save scroll position
    const wasScrolledToBottom = chatMessages.scrollHeight - chatMessages.scrollTop <= chatMessages.clientHeight + 100;
    
    // Clear and rebuild messages
    chatMessages.innerHTML = '';
    
    messages.slice(-50).forEach(msg => {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'chat-message' + (msg.username === chatUsername ? ' own' : '');
        
        const time = new Date(msg.time).toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        
        messageDiv.innerHTML = `
            <div class="chat-message-header">
                <span class="chat-username">${escapeHtml(msg.username)}</span>
                <span class="chat-time">${time}</span>
            </div>
            <div class="chat-message-text">${escapeHtml(msg.text)}</div>
        `;
        
        chatMessages.appendChild(messageDiv);
    });
    
    // Update last message ID
    lastMessageId = latestMessageId;
    
    // Save to localStorage
    localStorage.setItem('luxe-chat-backup', JSON.stringify(messages));
    
    // Auto-scroll if needed
    if (wasScrolledToBottom || forceScroll) {
        setTimeout(() => {
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }, 50);
    }
}

function sendMessage() {
    const input = document.getElementById('chatInput');
    const text = input.value.trim();
    
    if (!text) return;
    
    // Clear input immediately
    input.value = '';
    
    const newMessage = {
        id: Date.now(),
        username: chatUsername,
        text: text,
        time: Date.now()
    };
    
    // Get existing messages
    const messages = JSON.parse(localStorage.getItem('luxe-chat-backup') || '[]');
    messages.push(newMessage);
    
    // Keep only last 100 messages
    if (messages.length > 100) {
        messages.shift();
    }
    
    // Save to localStorage
    localStorage.setItem('luxe-chat-backup', JSON.stringify(messages));
    
    // Display immediately with force scroll
    displayMessages(messages, true);
    
    // Send to server in background
    fetch('https://jsonkeeper.com/b/LUXE_CHAT', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: messages })
    }).catch(() => {
        console.log('Using local storage mode');
    });
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function initChat() {
    document.getElementById('toggleChatBtn').addEventListener('click', function() {
        document.getElementById('chatModal').style.display = 'flex';
        initializeChat();
    });
    
    document.getElementById('closeChatBtn').addEventListener('click', function() {
        document.getElementById('chatModal').style.display = 'none';
    });
    
    document.getElementById('chatModalOverlay').addEventListener('click', function() {
        document.getElementById('chatModal').style.display = 'none';
    });
    
    document.getElementById('sendMessageBtn').addEventListener('click', sendMessage);
    
    document.getElementById('chatInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
}
