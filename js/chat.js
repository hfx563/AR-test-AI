// Group Chat Module
let chatUsername = '';
let lastMessageId = 0;

function initializeChat() {
    chatUsername = localStorage.getItem('chatUsername');
    if (!chatUsername) {
        chatUsername = prompt('Enter your name for chat:') || 'Traveler' + Math.floor(Math.random() * 1000);
        localStorage.setItem('chatUsername', chatUsername);
    }
    
    loadMessages();
    setInterval(loadMessages, 500);
}

function loadMessages() {
    fetch(`https://api.allorigins.win/raw?url=https://jsonkeeper.com/b/LUXE_CHAT`)
        .then(response => response.json())
        .then(data => {
            const messages = data.messages || [];
            displayMessages(messages);
        })
        .catch(error => {
            console.error('Error loading messages:', error);
            const messages = JSON.parse(localStorage.getItem('luxe-chat-backup') || '[]');
            displayMessages(messages);
        });
}

function displayMessages(messages) {
    const chatMessages = document.getElementById('chatMessages');
    
    if (messages.length === 0) {
        chatMessages.innerHTML = '<div class="chat-system-message">No messages yet. Be the first to say hello!</div>';
        return;
    }
    
    if (messages.length > 0 && messages[messages.length - 1].id > lastMessageId) {
        const wasScrolledToBottom = chatMessages.scrollHeight - chatMessages.scrollTop <= chatMessages.clientHeight + 50;
        
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
        
        if (wasScrolledToBottom) {
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }
        
        if (messages.length > 0) {
            lastMessageId = messages[messages.length - 1].id;
        }
        
        localStorage.setItem('luxe-chat-backup', JSON.stringify(messages));
    }
}

function sendMessage() {
    const input = document.getElementById('chatInput');
    const text = input.value.trim();
    
    if (!text) return;
    
    const newMessage = {
        id: Date.now(),
        username: chatUsername,
        text: text,
        time: Date.now()
    };
    
    const messages = JSON.parse(localStorage.getItem('luxe-chat-backup') || '[]');
    messages.push(newMessage);
    
    if (messages.length > 100) {
        messages.shift();
    }
    
    localStorage.setItem('luxe-chat-backup', JSON.stringify(messages));
    lastMessageId = newMessage.id;
    
    const chatMessages = document.getElementById('chatMessages');
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
    
    chatMessages.scrollTop = chatMessages.scrollHeight;
    input.value = '';
    
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
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
}
