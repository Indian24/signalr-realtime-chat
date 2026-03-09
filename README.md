# ASP.NET Core SignalR Reference Application

This is a lightweight, production-quality reference application demonstrating real-time communication using ASP.NET Core and SignalR. It's designed as an educational resource to teach developers how to implement real-time features following best practices.

## Learning Outcomes

By studying this project, developers will learn:

1. **SignalR Hub Architecture**: How to configure and integrate SignalR into an ASP.NET Core MVC application
2. **Real-Time State Management**: How to manage real-time state using a structured Hub
3. **Separation of Concerns**: How to decouple business logic from Hub implementation using Services and Dependency Injection
4. **JavaScript Client Integration**: How to build a JavaScript SignalR client that communicates bidirectionally with the server
5. **Connection Handling**: Best practices for handling connection states, automatic reconnection, and message broadcasting
6. **Memory Management**: How to implement bounded message history to prevent memory leaks in long-running sessions

## Features

- **Real-time Messaging**: Messages are broadcast to all connected users instantly
- **Active User List**: See who's currently connected to the chat
- **User Join/Leave Notifications**: System messages when users connect or disconnect
- **Typing Indicators**: See when other users are typing (with automatic timeout)
- **Automatic Reconnection**: Client automatically reconnects with exponential backoff if connection drops
- **Message History**: New users receive recent message history upon joining
- **Connection Status**: Visual indicator of current connection state

## Architecture

The application follows a clean, layered architecture:

- **Hubs** (`ChatHub`): Handles real-time WebSocket connections and method invocations
- **Services** (`IChatService` & `ChatService`): Contains business logic independent of the web framework
- **Data Store** (`ChatMemoryStore`): Thread-safe, in-memory storage for users and messages
- **Models** (`User`, `ChatMessage`): Simple domain models
- **Controllers/Views**: Standard ASP.NET Core MVC for serving the initial UI
- **Client** (JavaScript): SignalR client library for real-time communication

## How to Run

### Prerequisites
- .NET 8 SDK installed

### Steps
1. Clone or download this project
2. Open a terminal in the project directory
3. Run the application:
   ```bash
   dotnet run
   ```
4. Open your browser and navigate to `http://localhost:5000`
5. Enter a username and click "Join" to start chatting

The application will be running on port 5000 by default.

## How to Extend the System

This reference application is intentionally simple to remain educational. Here are common extensions:

### Add Persistent Storage
Replace `ChatMemoryStore` with Entity Framework Core and a real database:
```csharp
// Use SQL Server, PostgreSQL, or SQLite
var messages = await _dbContext.ChatMessages
    .OrderByDescending(m => m.Timestamp)
    .Take(200)
    .ToListAsync();
```

### Add User Authentication
Integrate ASP.NET Core Identity to manage registered users:
```csharp
public async Task JoinChat(string username)
{
    var user = User.FindFirst(ClaimTypes.NameIdentifier);
    if (user == null) return;
    
    // Associate SignalR connection with authenticated user
    _chatService.UserJoined(Context.ConnectionId, username);
    // ...
}
```

### Add Private Messaging
Send messages to specific users using SignalR groups or connection IDs:
```csharp
public async Task SendPrivateMessage(string recipientId, string message)
{
    await Clients.Client(recipientId).SendAsync("ReceivePrivateMessage", message);
}
```

### Add Chat Rooms
Create separate chat rooms using SignalR groups:
```csharp
public async Task JoinRoom(string roomName, string username)
{
    await Groups.AddToGroupAsync(Context.ConnectionId, roomName);
    await Clients.Group(roomName).SendAsync("UserJoined", username);
}
```

## Files Overview

- **Program.cs**: Application startup configuration and dependency injection
- **Hubs/ChatHub.cs**: SignalR hub handling real-time connections
- **Services/ChatService.cs**: Business logic for chat operations
- **Data/ChatMemoryStore.cs**: Thread-safe in-memory data store
- **Views/Home/Index.cshtml**: Chat UI template
- **wwwroot/js/chat.js**: JavaScript client for SignalR communication
- **wwwroot/css/site.css**: Application styling

## Documentation

- [ARCHITECTURE.md](ARCHITECTURE.md) - Detailed architecture explanation
- [docs/signalr-basics.md](docs/signalr-basics.md) - Beginner-friendly SignalR introduction

## Best Practices Demonstrated

- ✓ Thread-safe collections (ConcurrentDictionary, ConcurrentQueue)
- ✓ Dependency Injection for testability
- ✓ Separation of concerns (Hub vs Service vs Data layers)
- ✓ Proper HTML escaping to prevent XSS
- ✓ Connection state management
- ✓ Graceful error handling
- ✓ Bounded resource usage (message history limit)
- ✓ Clear code comments for educational purposes

## Limitations (Intentional)

This is a reference application designed for learning. In production, you would add:
- Database persistence (instead of in-memory storage)
- User authentication and authorization
- Rate limiting and spam prevention
- Message moderation
- Scaling with Redis or Service Bus
- Comprehensive error logging
