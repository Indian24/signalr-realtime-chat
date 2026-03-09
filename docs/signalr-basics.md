# SignalR Basics: A Beginner's Guide

SignalR is an open-source library for ASP.NET Core that simplifies adding real-time web functionality to applications. Real-time web functionality is the ability to have server code push content to connected clients instantly as it becomes available, rather than having the server wait for a client to request new data.

## 1. What does SignalR actually do?

In a traditional web application, the client (browser) makes an HTTP request to the server, the server processes it, sends back an HTML page or JSON data, and the connection closes. If the server has new data later, the client doesn't know about it until it makes another request (refreshing the page or using AJAX polling).

SignalR changes this by establishing a **persistent connection** between the client and the server. Once connected, both the server and the client can send messages to each other at any time.

## 2. How does it work? (Transports)

Under the hood, SignalR automatically chooses the best available transport mechanism:

1.  **WebSockets**: The optimal transport. It's a true, full-duplex, persistent connection over a single TCP socket. SignalR uses this if both the server and browser support it.
2.  **Server-Sent Events (SSE)**: If WebSockets aren't available, it falls back to SSE, where the server can push data to the client.
3.  **Long Polling**: The ultimate fallback. The client opens a request, the server holds it open until data is available, sends the data, and then the client immediately opens a new request.

You don't have to worry about these transports. SignalR negotiates the best one automatically.

## 3. The Core Concept: The "Hub"

The server-side component of SignalR is called a **Hub**. Think of a Hub as a high-level pipeline that allows the client and server to call methods on each other directly.

*   **Client Calling Server**: Your JavaScript can say, "Hey Server, execute the `SendMessage` method in your Hub and pass it this text."
*   **Server Calling Client**: Your C# Hub can say, "Hey all connected Clients, execute your JavaScript `ReceiveMessage` function and give it this data."

## 4. Connection Management

Every client that connects to a SignalR Hub is assigned a unique `ConnectionId`. You can use this ID to:
*   Identify specific users.
*   Send a message to one specific person (`Clients.Client(connectionId).SendAsync(...)`).
*   Group multiple ConnectionIds together (e.g., creating "rooms" like `Clients.Group("GamingRoom").SendAsync(...)`).

## 5. Hubs are Transient!

One of the most important things to learn: **Hubs are created and destroyed for every single method call.**

If a user calls `SendMessage`, ASP.NET Core creates a new instance of your Hub, runs the method, and destroys the Hub. You **cannot** save data inside a variable in your Hub class and expect it to be there on the next call. 

Instead, you must store state (like who is connected or chat history) in a database or a Singleton service, which is exactly what this reference project demonstrates with the `ChatMemoryStore` and `ChatService`.
