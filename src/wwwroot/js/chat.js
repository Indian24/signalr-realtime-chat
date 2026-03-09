// Client-side JavaScript for SignalR Chat with Rooms and Private Messaging

document.addEventListener("DOMContentLoaded", () => {
    // DOM Elements
    const loginSection = document.getElementById("login-section");
    const chatSection = document.getElementById("chat-section");
    const usernameInput = document.getElementById("username-input");
    const roomSelect = document.getElementById("room-select");
    const joinBtn = document.getElementById("join-btn");
    const messageInput = document.getElementById("message-input");
    const dmSelect = document.getElementById("dm-select");
    const sendBtn = document.getElementById("send-btn");
    const messagesList = document.getElementById("messages-list");
    const usersList = document.getElementById("users-list");
    const roomsList = document.getElementById("rooms-list");
    const userCount = document.getElementById("user-count");
    const currentRoomDisplay = document.getElementById("current-room");
    const currentModeDisplay = document.getElementById("current-mode");
    const connectionStatus = document.getElementById("connection-status");
    const typingIndicator = document.getElementById("typing-indicator");
    const typingUsers = document.getElementById("typing-users");

    let currentUser = "";
    let currentRoom = "general";
    let selectedDMUser = ""; // Track selected DM user
    let typingTimeout = null;
    const typingUsers_set = new Set();
    const allUsers = new Set();
    
    // Initialize SignalR Connection
    const connection = new signalR.HubConnectionBuilder()
        .withUrl("/chatHub")
        .withAutomaticReconnect([0, 1000, 3000, 5000, 10000])
        .configureLogging(signalR.LogLevel.Information)
        .build();

    // Setup UI event listeners
    setupUI();

    // SignalR Event Handlers
    
    // 1. Receive a public message
    connection.on("ReceiveMessage", (message) => {
        appendMessage(message.sender, message.content, message.timestamp, false);
    });

    // 2. Receive private message
    connection.on("ReceivePrivateMessage", (message) => {
        appendMessage(message.sender, message.content, message.timestamp, true, message.recipient);
    });

    // 3. Private message error
    connection.on("PrivateMessageError", (errorMsg) => {
        appendSystemMessage(`Error: ${errorMsg}`);
    });

    // 4. Receive message history upon joining a room
    connection.on("ReceiveMessageHistory", (messages) => {
        messagesList.innerHTML = "";
        messages.forEach(msg => {
            appendMessage(msg.sender, msg.content, msg.timestamp, msg.isPrivate, msg.recipient);
        });
    });

    // 5. User joined notification
    connection.on("UserJoined", (username) => {
        appendSystemMessage(`${username} joined the room`);
    });

    // 6. User left notification
    connection.on("UserLeft", (username) => {
        appendSystemMessage(`${username} left the room`);
        typingUsers_set.delete(username);
        updateTypingIndicator();
    });

    // 7. Update the active user list for current room
    connection.on("UpdateUserList", (users) => {
        usersList.innerHTML = "";
        userCount.textContent = users.length;
        
        users.forEach(user => {
            const li = document.createElement("li");
            li.textContent = user.username + (user.username === currentUser ? " (You)" : "");
            li.style.cursor = "pointer";
            li.addEventListener("click", () => startDirectMessage(user.username));
            usersList.appendChild(li);
        });
    });

    // 8. Receive all active users (for DM dropdown)
    connection.on("ReceiveActiveUsers", (users) => {
        allUsers.clear();
        dmSelect.innerHTML = '<option value="">Public</option>';
        
        users.forEach(user => {
            if (user.username !== currentUser) {
                allUsers.add(user.username);
                const option = document.createElement("option");
                option.value = user.username;
                option.textContent = user.username;
                dmSelect.appendChild(option);
            }
        });
    });

    // 9. Receive available rooms and current room
    connection.on("ReceiveRooms", (rooms, activeRoom) => {
        currentRoom = activeRoom;
        currentRoomDisplay.textContent = activeRoom;
        selectedDMUser = ""; // Clear DM selection when changing rooms
        dmSelect.value = "";
        updateModeDisplay();
        
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

    // 10. User is typing notification
    connection.on("UserIsTyping", (username) => {
        if (username !== currentUser) {
            typingUsers_set.add(username);
            updateTypingIndicator();
        }
    });

    // 11. User stopped typing notification
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

    startConnection();

    // Helper Functions
    function setupUI() {
        usernameInput.addEventListener("input", (e) => {
            joinBtn.disabled = e.target.value.trim().length === 0 || connection.state !== signalR.HubConnectionState.Connected;
        });

        usernameInput.addEventListener("keypress", (e) => {
            if (e.key === "Enter" && !joinBtn.disabled) {
                joinChat();
            }
        });

        joinBtn.addEventListener("click", joinChat);
        sendBtn.addEventListener("click", sendMessage);

        messageInput.addEventListener("keypress", (e) => {
            if (e.key === "Enter" && !sendBtn.disabled) {
                sendMessage();
            }
        });

        messageInput.addEventListener("input", notifyTyping);
        
        // DM selection changes
        dmSelect.addEventListener("change", (e) => {
            selectedDMUser = e.target.value;
            updateModeDisplay();
            messagesList.innerHTML = ""; // Clear message history when switching
        });
    }

    function joinChat() {
        const username = usernameInput.value.trim();
        const room = roomSelect.value;
        
        if (!username) return;

        currentUser = username;
        
        connection.invoke("JoinChat", username, room)
            .then(() => {
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
                selectedDMUser = "";
                dmSelect.value = "";
                typingUsers_set.clear();
                updateTypingIndicator();
                updateModeDisplay();
                messageInput.focus();
                
                Array.from(roomsList.querySelectorAll("li")).forEach(li => {
                    li.className = li.textContent === newRoom ? "active" : "";
                });
            })
            .catch(err => {
                console.error("Error changing room:", err);
            });
    }

    function startDirectMessage(username) {
        dmSelect.value = username;
        selectedDMUser = username;
        updateModeDisplay();
        messagesList.innerHTML = ""; // Clear message history
        messageInput.focus();
    }

    function sendMessage() {
        const message = messageInput.value.trim();
        if (!message) return;

        messageInput.value = "";
        messageInput.focus();

        clearTypingTimer();
        connection.invoke("NotifyStoppedTyping", currentUser).catch(console.error);

        if (selectedDMUser) {
            // Send private message
            connection.invoke("SendPrivateMessage", currentUser, selectedDMUser, message)
                .catch(err => {
                    console.error("Error sending private message:", err);
                    appendSystemMessage("Failed to send private message.");
                });
        } else {
            // Send public message
            connection.invoke("SendMessage", currentUser, message)
                .catch(err => {
                    console.error("Error sending message:", err);
                    appendSystemMessage("Failed to send message: " + message);
                });
        }
    }

    function notifyTyping() {
        clearTypingTimer();
        connection.invoke("NotifyTyping", currentUser).catch(console.error);
        
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

    function updateModeDisplay() {
        if (selectedDMUser) {
            currentModeDisplay.textContent = "Private message";
        } else {
            currentModeDisplay.textContent = "Chat Room";
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

    function appendMessage(sender, content, timestamp, isPrivate, recipient) {
        const time = new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const isSelf = sender === currentUser;
        
        const messageDiv = document.createElement("div");
        let className = `message ${isSelf ? 'self' : ''}`;
        if (isPrivate) className += ' private-message';
        messageDiv.className = className;
        
        let headerHtml = `<span class="message-sender">${sender}</span>`;
        if (isPrivate) {
            headerHtml += ` <span class="message-badge">Private</span>`;
            if (!isSelf) {
                headerHtml += ` <span class="message-to">to you</span>`;
            } else {
                headerHtml += ` <span class="message-to">to ${recipient}</span>`;
            }
        }
        headerHtml += `<span class="message-time">${time}</span>`;
        
        messageDiv.innerHTML = `
            <div class="message-header">
                ${headerHtml}
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

    function escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
});