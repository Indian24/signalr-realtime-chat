using Microsoft.AspNetCore.SignalR;
using SignalRChat.Services;
using System;
using System.Threading.Tasks;

namespace SignalRChat.Hubs
{
    /// <summary>
    /// The SignalR Hub is the central component for real-time communication.
    /// It handles incoming connections, disconnections, and message broadcasting.
    /// </summary>
    public class ChatHub : Hub
    {
        private readonly IChatService _chatService;

        // Dependencies are injected automatically by the ASP.NET Core DI container
        public ChatHub(IChatService chatService)
        {
            _chatService = chatService;
        }

        /// <summary>
        /// Called when a client connects to the hub.
        /// </summary>
        public override async Task OnConnectedAsync()
        {
            await base.OnConnectedAsync();
        }

        /// <summary>
        /// Called when a client disconnects from the hub.
        /// </summary>
        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            // Clean up user from our store
            _chatService.UserLeft(Context.ConnectionId);
            
            // Notify other clients to update their user list
            await Clients.Others.SendAsync("UpdateUserList", _chatService.GetActiveUsers());
            
            await base.OnDisconnectedAsync(exception);
        }

        /// <summary>
        /// Called by clients to join the chat with a specific username.
        /// </summary>
        public async Task JoinChat(string username)
        {
            // Store the user
            _chatService.UserJoined(Context.ConnectionId, username);
            
            // Send recent message history to the newly connected client
            var history = _chatService.GetRecentMessages();
            await Clients.Caller.SendAsync("ReceiveMessageHistory", history);
            
            // Broadcast to everyone that a new user joined
            await Clients.All.SendAsync("UserJoined", username);
            
            // Update the user list for everyone
            await Clients.All.SendAsync("UpdateUserList", _chatService.GetActiveUsers());
        }

        /// <summary>
        /// Called by clients to send a message.
        /// </summary>
        public async Task SendMessage(string username, string message)
        {
            // Use the service to store the message
            var chatMessage = _chatService.CreateAndStoreMessage(username, message);
            
            // Broadcast the message to all connected clients
            // Best Practice: Use structured data (objects) rather than multiple parameters
            await Clients.All.SendAsync("ReceiveMessage", chatMessage);
        }
    }
}