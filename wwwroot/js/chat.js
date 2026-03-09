// Client-side JavaScript for SignalR Chat

document.addEventListener("DOMContentLoaded", () => {
    // DOM Elements
    const loginSection = document.getElementById("login-section");
    const chatSection = document.getElementById("chat-section");
    const usernameInput = document.getElementById("username-input");
    const joinBtn = document.getElementById("join-btn");
    const messageInput = document.getElementById("message-input");
    const sendBtn = document.getElementById("send-btn");
    const messagesList = document.getElementById("messages-list");
    const usersList = document.getElementById("users-list");
    const userCount = document.getElementById("user-count");
    const connectionStatus = document.getElementById("connection-status");

    let currentUser = "";
    
    // Initialize SignalR Connection
    // The URL must match the one mapped in Program.cs
    const connection = new signalR.HubConnectionBuilder()
        .withUrl("/chatHub")
        .withAutomaticReconnect() // Automatically try to reconnect if connection drops
        .configureLogging(signalR.LogLevel.Information) // Useful for debugging
        .build();

    // Setup UI event listeners
    setupUI();

    // SignalR Event Handlers
    
    // 1. Receive a new message
    connection.on("ReceiveMessage", (message) => {
        appendMessage(message.sender, message.content, message.timestamp);
    });

    // 2. Receive message history upon joining
    connection.on("ReceiveMessageHistory", (messages) => {
        messagesList.innerHTML = ""; // Clear existing
        messages.forEach(msg => {
            appendMessage(msg.sender, msg.content, msg.timestamp);
        });
    });

    // 3. User joined notification
    connection.on("UserJoined", (username) => {
        appendSystemMessage(`${username} joined the chat`);
    });

    // 4. Update the active user list
    connection.on("UpdateUserList", (users) => {
        usersList.innerHTML = "";
        userCount.textContent = users.length;
        
        users.forEach(user => {
            const li = document.createElement("li");
            li.textContent = user.username + (user.username === currentUser ? " (You)" : "");
            usersList.appendChild(li);
        });
    });

    // Handle connection state changes
    connection.onreconnecting(error => {
        connectionStatus.textContent = "Reconnecting...";
        connectionStatus.className = "status-indicator";
        disableChatControls();
    });

    connection.onreconnected(connectionId => {
        connectionStatus.textContent = "Connected";
        connectionStatus.className = "status-indicator connected";
        enableChatControls();
        // Re-join the chat with the same username
        connection.invoke("JoinChat", currentUser).catch(console.error);
    });

    connection.onclose(error => {
        connectionStatus.textContent = "Disconnected";
        connectionStatus.className = "status-indicator";
        disableChatControls();
        appendSystemMessage("Connection closed. Please refresh to reconnect.");
    });

    // Start the connection
    async function startConnection() {
        try {
            await connection.start();
            console.log("SignalR Connected.");
            joinBtn.disabled = false;
        } catch (err) {
            console.error("Error connecting to SignalR:", err);
            setTimeout(startConnection, 5000);
        }
    }

    // Initialize
    startConnection();

    // Helper Functions
    function setupUI() {
        // Enable join button only if username is entered
        usernameInput.addEventListener("input", (e) => {
            joinBtn.disabled = e.target.value.trim().length === 0 || connection.state !== signalR.HubConnectionState.Connected;
        });

        // Join on Enter key
        usernameInput.addEventListener("keypress", (e) => {
            if (e.key === "Enter" && !joinBtn.disabled) {
                joinChat();
            }
        });

        // Join on button click
        joinBtn.addEventListener("click", joinChat);

        // Send message on button click
        sendBtn.addEventListener("click", sendMessage);

        // Send message on Enter key
        messageInput.addEventListener("keypress", (e) => {
            if (e.key === "Enter" && !sendBtn.disabled) {
                sendMessage();
            }
        });
    }

    function joinChat() {
        const username = usernameInput.value.trim();
        if (!username) return;

        currentUser = username;
        
        // Invoke the JoinChat method on the Hub
        connection.invoke("JoinChat", username)
            .then(() => {
                // Switch UI from Login to Chat
                loginSection.classList.add("hidden");
                chatSection.classList.remove("hidden");
                
                connectionStatus.textContent = "Connected";
                connectionStatus.className = "status-indicator connected";
                
                messageInput.focus();
            })
            .catch(err => {
                console.error("Error joining chat:", err);
                alert("Failed to join chat. Please try again.");
            });
    }

    function sendMessage() {
        const message = messageInput.value.trim();
        if (!message) return;

        // Clear input early for better UX
        messageInput.value = "";
        messageInput.focus();

        // Invoke SendMessage on the Hub
        connection.invoke("SendMessage", currentUser, message)
            .catch(err => {
                console.error("Error sending message:", err);
                // In a real app, you might want to show this message failed to send
                appendSystemMessage("Failed to send message: " + message);
            });
    }

    function appendMessage(sender, content, timestamp) {
        const time = new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const isSelf = sender === currentUser;
        
        const messageDiv = document.createElement("div");
        messageDiv.className = `message ${isSelf ? 'self' : ''}`;
        
        messageDiv.innerHTML = `
            <div class="message-header">
                <span class="message-sender">${sender}</span>
                <span class="message-time">${time}</span>
            </div>
            <div class="message-bubble">${escapeHtml(content)}</div>
        `;
        
        messagesList.appendChild(messageDiv);
        scrollToBottom();
    }

    function appendSystemMessage(content) {
        const div = document.createElement("div");
        div.className = "system-message";
        div.textContent = content;
        messagesList.appendChild(div);
        scrollToBottom();
    }

    function scrollToBottom() {
        messagesList.scrollTop = messagesList.scrollHeight;
    }

    function disableChatControls() {
        messageInput.disabled = true;
        sendBtn.disabled = true;
    }

    function enableChatControls() {
        messageInput.disabled = false;
        sendBtn.disabled = false;
    }

    // Security: Escape HTML to prevent XSS
    function escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
});