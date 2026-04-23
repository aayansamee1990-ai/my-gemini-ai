// This looks for a key saved in your browser, NOT on GitHub.
let API_KEY = localStorage.getItem('gemini_api_key');

if (!API_KEY) {
    API_KEY = prompt("AIzaSyDkCsWwddSCK3brb5gG4MqSJU4Af4fGek0:");
    if (API_KEY) {
        localStorage.setItem('gemini_api_key', API_KEY);
    }
}

// Updated 2026 Model Name
const MODEL_NAME = "gemini-3.1-flash-preview";
const chatBox = document.getElementById('chat-box');
const input = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');
const statusText = document.getElementById('status');
const historyList = document.getElementById('history-list');
const newChatBtn = document.getElementById('new-chat-btn');
const chatTitleDisplay = document.getElementById('chat-title');

// Load saved chats from the browser's hard drive (localStorage)
let chats = JSON.parse(localStorage.getItem('my_ai_chats')) || [];
let currentChatId = null;

// --- MEMORY FUNCTIONS ---
function saveChatsToStorage() {
    localStorage.setItem('my_ai_chats', JSON.stringify(chats));
    renderSidebar();
}

function startNewChat() {
    currentChatId = Date.now(); // Create a unique ID
    chats.push({ id: currentChatId, title: "New Conversation", messages: [] });
    saveChatsToStorage();
    loadChat(currentChatId);
}

function loadChat(id) {
    currentChatId = id;
    const chat = chats.find(c => c.id === id);
    chatTitleDisplay.innerText = chat.title;
    
    // Clear screen and load history
    chatBox.innerHTML = ""; 
    if (chat.messages.length === 0) {
        chatBox.innerHTML = `<div class="message ai-msg"><b>AI:</b> Hello! How can I help you today?</div>`;
    } else {
        chat.messages.forEach(msg => {
            const msgClass = msg.sender === "user" ? "user-msg" : "ai-msg";
            const name = msg.sender === "user" ? "You" : "AI";
            chatBox.innerHTML += `<div class="message ${msgClass}"><b>${name}:</b> ${msg.text}</div>`;
        });
    }
    chatBox.scrollTop = chatBox.scrollHeight;
    renderSidebar();
}

function renderSidebar() {
    historyList.innerHTML = "";
    // Show chats from newest to oldest
    [...chats].reverse().forEach(chat => {
        const div = document.createElement('div');
        div.className = `history-item ${chat.id === currentChatId ? 'active' : ''}`;
        div.innerText = chat.title;
        div.onclick = () => loadChat(chat.id);
        historyList.appendChild(div);
    });
}

// --- AI COMMUNICATION ---
sendBtn.onclick = async () => {
    const text = input.value.trim();
    if (!text) return;
    if (!currentChatId) startNewChat();

    const currentChat = chats.find(c => c.id === currentChatId);
    if (currentChat.messages.length === 0) currentChat.title = text.substring(0, 20) + "...";

    currentChat.messages.push({ sender: "user", text: text });
    chatBox.innerHTML += `<div class="message user-msg"><b>You:</b> ${text}</div>`;
    input.value = "";
    statusText.innerText = "Status: Thinking...";
    saveChatsToStorage();

    try {
        // Correct 2026 Endpoint
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${API_KEY}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contents: [{ parts: [{ text: text }] }] })
        });

        const data = await response.json();
        
        if (data.candidates && data.candidates[0].content) {
            const aiText = data.candidates[0].content.parts[0].text;
            currentChat.messages.push({ sender: "ai", text: aiText });
            chatBox.innerHTML += `<div class="message ai-msg"><b>AI:</b> ${aiText}</div>`;
        } else {
            // This shows you the ACTUAL error from Google
            const errorInfo = data.error ? data.error.message : "Check console (F12)";
            chatBox.innerHTML += `<div class="message ai-msg"><b>Error:</b> ${errorInfo}</div>`;
        }
        
        statusText.innerText = "Status: Online";
        saveChatsToStorage();
        chatBox.scrollTop = chatBox.scrollHeight;

    } catch (err) {
        statusText.innerText = "Status: Connection Failed";
    }
};

    // Save User Message
    currentChat.messages.push({ sender: "user", text: text });
    chatBox.innerHTML += `<div class="message user-msg"><b>You:</b> ${text}</div>`;
    input.value = "";
    statusText.innerText = "Status: Thinking...";
    saveChatsToStorage();
    chatBox.scrollTop = chatBox.scrollHeight;

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${API_KEY}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contents: [{ parts: [{ text: text }] }] })
        });

        const data = await response.json();
        
        if (data.candidates && data.candidates[0].content) {
            const aiText = data.candidates[0].content.parts[0].text;
            // Save AI Message
            currentChat.messages.push({ sender: "ai", text: aiText });
            chatBox.innerHTML += `<div class="message ai-msg"><b>AI:</b> ${aiText}</div>`;
        } else {
            chatBox.innerHTML += `<div class="message ai-msg"><b>Error:</b> Something went wrong.</div>`;
        }
        
        statusText.innerText = "Status: Online";
        saveChatsToStorage();
        chatBox.scrollTop = chatBox.scrollHeight;

    } catch (err) {
        statusText.innerText = "Status: Connection Failed";
    }
};

newChatBtn.onclick = startNewChat;

// --- STARTUP ---
if (chats.length > 0) {
    loadChat(chats[chats.length - 1].id); // Load the most recent chat
} else {
    startNewChat();
}
