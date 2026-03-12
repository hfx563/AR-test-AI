// Group Chat Module - Real-time Live Chat
let chatUsername = '';
let chatMessages = [];
let isPolling = false;
let pollInterval = null;
const CHAT_API_URL = 'https://jsonkeeper.com/b/LUXE_CHAT';
const CHAT_STORAGE_KEY = 'luxe-travel-chat-messages';
const CHAT_USER_KEY = 'luxe-travel-chat-username';
const POLL_INTERVAL = 2000; // Poll every 2 seconds for real-time feel

// Initialize chat when modal opens
function initChat() {
    document.getElementById('toggleChatBtn').addEventListener('click', openChat);
    document.getElementById('closeChatBtn').addEventListener('click', closeChat);
    document.getElementById('chatModalOverlay').addEventListener('click', closeChat);
    document.getElementById('sendMessageBtn').addEventListener('click', sendChatMessage);
    
    document.getElementById('chatInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendChatMessage();
        }
    });
}

function openChat() {
    // Get or create username
    chatUsername = localStorage.getItem(CHAT_USER_KEY);
    if (!chatUsername) {
        chatUsername = prompt('Enter your name for chat:');
        if (!chatUsername || chatUsername.trim() === '') {
            chatUsername = 'Traveler' + Math.floor(Math.random() * 9999);
        }
        chatUsername = chatUsername.trim();
        localStorage.setItem(CHAT_USER_KEY, chatUsername);
    }
    
    // Show modal
    document.getElementById('chatModal').style.display = 'flex';
    
    // Load messages immediately from server
    syncMessagesFromServer();
    
    // Start real-time polling
    if (!isPolling) {
        isPolling = true;
        pollInterval = setInterval(syncMessagesFromServer, POLL_INTERVAL);
    }
}

function closeChat() {
    document.getElementById('chatModal').style.display = 'none';
    
    // Stop polling when chat is closed
    if (pollInterval) {
        clearInterval(pollInterval);
        pollInterval = null;
        isPolling = false;
    }
}

function syncMessagesFromServer() {
    // Fetch latest messages from server
    fetch(CHAT_API_URL)
        .then(response => {
            if (!response.ok) throw new Error('Server unavailable');
            return response.json();
        })
        .then(data => {
            if (data && data.messages && Array.isArray(data.messages)) {
                const serverMessages = data.messages;
                
                // Check if we have new messages
                const hasNewMessages = serverMessages.length !== chatMessages.length ||
                    JSON.stringify(serverMessages) !== JSON.stringify(chatMessages);
                
                if (hasNewMessages) {
                    chatMessages = serverMessages;
                    saveToLocalStorage();
                    renderMessages();
                }
            } else {
                // No messages on server, load from localStorage
                loadFromLocalStorage();
            }
        })
        .catch(error => {
            console.log('Server sync failed, using local storage:', error.message);
            loadFromLocalStorage();
        });
}

function loadFromLocalStorage() {
    try {
        const stored = localStorage.getItem(CHAT_STORAGE_KEY);
        if (stored) {
            const localMessages = JSON.parse(stored);
            if (localMessages.length > chatMessages.length) {
                chatMessages = localMessages;
                renderMessages();
            }
        }
        if (chatMessages.length === 0) {
            showEmptyState();
        }
    } catch (error) {
        console.error('Error loading from localStorage:', error);
        showEmptyState();
    }
}

function sendChatMessage() {
    const input = document.getElementById('chatInput');
    const text = input.value.trim();
    
    if (!text) return;
    
    // Clear input immediately for better UX
    input.value = '';
    
    // Create new message with unique ID
    const newMessage = {
        id: Date.now() + '-' + Math.random().toString(36).substr(2, 9),
        username: chatUsername,
        text: text,
        time: Date.now()
    };
    
    // Add to local messages array
    chatMessages.push(newMessage);
    
    // Keep only last 100 messages
    if (chatMessages.length > 100) {
        chatMessages = chatMessages.slice(-100);
    }
    
    // Save to localStorage immediately
    saveToLocalStorage();
    
    // Render immediately for instant feedback
    renderMessages(true);
    
    // Upload to server for other users
    uploadToServer();
}

function uploadToServer() {
    fetch(CHAT_API_URL, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ messages: chatMessages })
    })
    .then(response => {
        if (response.ok) {
            console.log('✅ Message synced to server - other users will see it!');
            // Immediately sync to get any messages from other users
            setTimeout(syncMessagesFromServer, 500);
        } else {
            console.log('⚠️ Server sync failed, message saved locally');
        }
    })
    .catch(error => {
        console.log('⚠️ Server unavailable, message saved locally only');
    });
}

function saveToLocalStorage() {
    try {
        localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(chatMessages));
    } catch (error) {
        console.error('Error saving to localStorage:', error);
    }
}

function renderMessages(scrollToBottom = false) {
    const container = document.getElementById('chatMessages');
    
    if (!chatMessages || chatMessages.length === 0) {
        showEmptyState();
        return;
    }
    
    // Check if user was scrolled to bottom
    const wasAtBottom = container.scrollHeight - container.scrollTop <= container.clientHeight + 100;
    
    // Clear container
    container.innerHTML = '';
    
    // Show last 50 messages
    const messagesToShow = chatMessages.slice(-50);
    
    messagesToShow.forEach(msg => {
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
        
        container.appendChild(messageDiv);
    });
    
    // Auto-scroll if user was at bottom or if forced
    if (wasAtBottom || scrollToBottom) {
        setTimeout(() => {
            container.scrollTop = container.scrollHeight;
        }, 50);
    }
}

function showEmptyState() {
    const container = document.getElementById('chatMessages');
    container.innerHTML = '<div class="chat-system-message">No messages yet. Be the first to say hello! 👋</div>';
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
