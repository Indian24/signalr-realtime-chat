# Project Architecture

This application utilizes ASP.NET Core 8 MVC and SignalR to deliver a real-time messaging experience. The architecture is deliberately separated into clear layers to demonstrate best practices for maintainability and testability.

## 1. The Presentation Layer (MVC & JavaScript)

- **Controllers (`HomeController`)**: In this application, the MVC controller's role is minimal. It simply serves the initial HTML/CSS/JS (`Index.cshtml` and `_Layout.cshtml`) that makes up the chat interface.
- **Client-Side Script (`wwwroot/js/chat.js`)**: Once the page loads, JavaScript takes over. It uses the `@microsoft/signalr` client library to establish a persistent WebSockets connection to the server.

## 2. The Real-Time Layer (SignalR Hubs)

- **`ChatHub`**: This is the entry point for real-time WebSockets traffic. It inherits from `Hub` and handles:
  - Client connections and disconnections.
  - Method invocations from the client (e.g., `JoinChat`, `SendMessage`).
  - Broadcasting events to all clients, specific clients, or groups.

**Important Concept**: Hubs in SignalR are transient. A new instance of `ChatHub` is created for every hub method invocation. Therefore, you **cannot** store state in properties of the Hub itself.

## 3. The Service Layer

To solve the transient nature of Hubs and to keep business logic separate from transport logic, we use a service layer.

- **`IChatService` / `ChatService`**: This service contains all the business logic for the chat room. It manages users joining/leaving and handles message creation. The Hub delegates all state-changing operations to this service. Because it is registered as a scoped service, it can safely inject and interact with the data layer.

## 4. The Data Layer

- **`ChatMemoryStore`**: This is registered as a `Singleton` in the ASP.NET Core Dependency Injection container (`Program.cs`). Because it's a singleton, it persists across all requests and hub invocations.
- It uses thread-safe collections (`ConcurrentDictionary` and `ConcurrentQueue`) because in a highly concurrent real-time application, multiple threads will be reading and writing to these collections simultaneously.

## Interaction Flow

1. **User Sends Message**: The user clicks "Send".
2. **Client to Server**: JavaScript calls `connection.invoke("SendMessage", user, message)`.
3. **Hub Reception**: The `ChatHub.SendMessage` method is triggered.
4. **Service Delegation**: The Hub calls `_chatService.CreateAndStoreMessage()`.
5. **Data Storage**: The Service writes the message to `ChatMemoryStore`.
6. **Server to Client Broadcast**: The Hub calls `Clients.All.SendAsync("ReceiveMessage", chatMessage)`.
7. **Client Reception**: All connected clients receive the message and JavaScript updates the DOM instantly without a page refresh.
