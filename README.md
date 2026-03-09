# ASP.NET Core SignalR Reference Application

This project is a lightweight, production-quality reference application demonstrating real-time communication using ASP.NET Core and SignalR. It is designed as an educational resource to teach developers how to implement real-time features following best practices.

## Learning Outcomes

By reviewing this project, developers will learn:
1. How to configure and integrate SignalR into an ASP.NET Core MVC application.
2. How to manage real-time state using a structured `Hub`.
3. How to decouple business logic from Hub implementation using Services and Dependency Injection.
4. How to build a JavaScript client that communicates with the SignalR hub.
5. Best practices for handling connection states, reconnections, and broadcasting messages.

## Architecture

The project follows a clean, decoupled architecture:
- **Hubs**: Handles SignalR real-time connections (`ChatHub`).
- **Services**: Manages business logic and chat state independently of the web framework (`IChatService` & `ChatService`).
- **Data**: A thread-safe, in-memory store representing data persistence (`ChatMemoryStore`).
- **Models**: Simple domain models (`User`, `ChatMessage`).
- **Controllers/Views**: Standard MVC components for serving the initial UI.

For more details, see [ARCHITECTURE.md](ARCHITECTURE.md) and [docs/signalr-basics.md](docs/signalr-basics.md).

## How to Run

1. Make sure you have the .NET 8 SDK installed.
2. Open a terminal in the project directory.
3. Run the application:
   ```bash
   dotnet run
   ```
4. Open your browser and navigate to the application URL (typically `http://localhost:5000` or `https://localhost:5001`). The chat interface is hosted on the root URL (`/`).

## How to Extend the System

Developers can extend this reference application in several ways:
- **Persistent Storage**: Replace the `ChatMemoryStore` with Entity Framework Core and a real database (like PostgreSQL or SQL Server).
- **Authentication**: Integrate ASP.NET Core Identity to manage registered users, allowing SignalR to authorize clients based on claims.
- **Private Messaging**: Implement direct messaging by sending messages to specific `ConnectionId`s or adding users to SignalR `Groups`.
- **Typing Indicators**: Add a feature to broadcast when a user is currently typing.
