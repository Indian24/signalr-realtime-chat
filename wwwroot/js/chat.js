// Client-side JavaScript for SignalR Chat with Rooms

document.addEventListener("DOMContentLoaded", () => {
    // DOM Elements
    const loginSection = document.getElementById("login-section");
    const chatSection = document.getElementById("chat-section");
    const usernameInput = document.getElementById("username-input");
    const roomSelect = document.getElementById("room-select");
    const joinBtn = document.getElementById("join-btn");
    const messageInput = document.getElementById("message-input");
    const sendBtn = document.getElementById("send-btn");
    const messagesList = document.getElementById("messages-list");
    const usersList = document.getElementById("users-list");
    const roomsList = document.getElementById("rooms-list");
    const userCount = document.getElementById("user-count");
    const currentRoomDisplay = document.getElementById("current-room");
    const connectionStatus = document.getElementById("connection-status");
    const typingIndicator = document.getElementById("typing-indicator");
    const typingUsers = document.getElementById("typing-users");

    let currentUser = "";
    let currentRoom = "general";
    let typingTimeout = null;
    const typingUsers_set = new Set();
    
    // Initialize SignalR Connection
    // The URL must match the one mapped in Program.cs
    const connection = new signalR.HubConnectionBuilder()
        .withUrl("/chatHub")
        .withAutomaticReconnect([
            0,      // Immediate first retry
            1000,   // 1 second
            3000,   // 3 seconds
            5000,   // 5 seconds
            10000,  // 10 seconds
        ]) // Automatically try to reconnect with escalating delays
        .configureLogging(signalR.LogLevel.Information) // Useful for debugging
        .build();

    // Setup UI event listeners
    setupUI();

    // SignalR Event Handlers
    
    // 1. Receive a new message
    connection.on("ReceiveMessage", (message) => {
        appendMessage(message.sender, message.content, message.timestamp);
    });

    // 2. Receive message history upon joining a room
    connection.on("ReceiveMessageHistory", (messages) => {
        messagesList.innerHTML = ""; // Clear existing
        messages.forEach(msg => {
            appendMessage(msg.sender, msg.content, msg.timestamp);
        });
    });

    // 3. User joined notification
    connection.on("UserJoined", (username) => {
        appendSystemMessage(`${username} joined the room`);
    });

    // 4. User left notification
    connection.on("UserLeft", (username) => {
        appendSystemMessage(`${username} left the room`);
        typingUsers_set.delete(username);
        updateTypingIndicator();
    });

    // 5. Update the active user list for current room
    connection.on("UpdateUserList", (users) => {
        usersList.innerHTML = "";
        userCount.textContent = users.length;
        
        users.forEach(user => {
            const li = document.createElement("li");
            li.textContent = user.username + (user.username === currentUser ? " (You)" : "");
            usersList.appendChild(li);
        });
    });

    // 6. Receive available rooms and current room
    connection.on("ReceiveRooms", (rooms, activeRoom) => {
        currentRoom = activeRoom;
        currentRoomDisplay.textContent = activeRoom;
        
        roomsList.innerHTML = "";
        rooms.forEach(room => {
            const li = document.createElement("li");
            li.className = room === currentRoom ? "active" : "";
            li.textContent = room;
            li.style.cursor = "pointer";
            li.addEventListener("click", () => changeRoom(room));
            roomsList.appendChild(li);
        });
    });

    // 7. User is typing notification
    connection.on("UserIsTyping", (username) => {
        if (username !== currentUser) {
            typingUsers_set.add(username);
            updateTypingIndicator();
        }
    });

    // 8. User stopped typing notification
    connection.on("UserStoppedTyping", (username) => {
        typingUsers_set.delete(username);
        updateTypingIndicator();
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
        // Re-join the chat with the same username and room
        if (currentUser) {
            connection.invoke("JoinChat", currentUser, currentRoom).catch(console.error);
        }
    });

    connection.onclose(error => {
        connectionStatus.textContent = "Disconnected";
        connectionStatus.className = "status-indicator";
        disableChatControls();
        appendSystemMessage("Connection closed. Attempting to reconnect...");
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

        // Notify server when user is typing
        messageInput.addEventListener("input", notifyTyping);
    }

    function joinChat() {
        const username = usernameInput.value.trim();
        const room = roomSelect.value;
        
        if (!username) return;

        currentUser = username;
        
        // Invoke the JoinChat method on the Hub with room
        connection.invoke("JoinChat", username, room)
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

    function changeRoom(newRoom) {
        if (newRoom === currentRoom) return;
        
        connection.invoke("ChangeRoom", currentUser, newRoom)
            .then(() => {
                currentRoom = newRoom;
                currentRoomDisplay.textContent = newRoom;
                typingUsers_set.clear();
                updateTypingIndicator();
                messageInput.focus();
                
                // Update room list highlighting
                Array.from(roomsList.querySelectorAll("li")).forEach(li => {
                    li.className = li.textContent === newRoom ? "active" : "";
                });
            })
            .catch(err => {
                console.error("Error changing room:", err);
            });
    }

    function sendMessage() {
        const message = messageInput.value.trim();
        if (!message) return;

        // Clear input early for better UX
        messageInput.value = "";
        messageInput.focus();

        // Clear typing indicator
        clearTypingTimer();
        connection.invoke("NotifyStoppedTyping", currentUser).catch(console.error);

        // Invoke SendMessage on the Hub
        connection.invoke("SendMessage", currentUser, message)
            .catch(err => {
                console.error("Error sending message:", err);
                appendSystemMessage("Failed to send message: " + message);
            });
    }

    // Debounced typing notification
    function notifyTyping() {
        clearTypingTimer();
        
        // Notify server that user is typing
        connection.invoke("NotifyTyping", currentUser).catch(console.error);
        
        // Set a timeout to notify when typing stops (2 seconds of inactivity)
        typingTimeout = setTimeout(() => {
            connection.invoke("NotifyStoppedTyping", currentUser).catch(console.error);
        }, 2000);
    }

    function clearTypingTimer() {
        if (typingTimeout) {
            clearTimeout(typingTimeout);
            typingTimeout = null;
        }
    }

    function updateTypingIndicator() {
        if (typingUsers_set.size === 0) {
            typingIndicator.classList.add("hidden");
        } else {
            typingIndicator.classList.remove("hidden");
            const userList = Array.from(typingUsers_set).join(", ");
            typingUsers.textContent = typingUsers_set.size === 1 
                ? `${userList} is typing` 
                : `${userList} are typing`;
        }
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