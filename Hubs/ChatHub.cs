using Microsoft.AspNetCore.SignalR;
using SignalRChat.Services;
using System;
using System.Threading.Tasks;

namespace SignalRChat.Hubs
{
    /// <summary>
    /// The SignalR Hub is the central component for real-time communication.
    /// Uses SignalR Groups to implement chat rooms - users are added to a group
    /// corresponding to their current room, and messages are sent only to that group.
    /// 
    /// Best Practice: Hubs are transient - a new instance is created for every method invocation.
    /// Therefore, all state must be persisted in the ChatService or database, not in the Hub itself.
    /// </summary>
    public class ChatHub : Hub
    {
        private readonly IChatService _chatService;

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
            var user = _chatService.GetUserByConnectionId(Context.ConnectionId);
            if (user != null)
            {
                _chatService.UserLeft(Context.ConnectionId);
                
                // Notify others in the room that this user left
                await Clients.Group(user.CurrentRoom).SendAsync("UserLeft", user.Username);
                
                // Update the user list for the room
                await Clients.Group(user.CurrentRoom).SendAsync("UpdateUserList", 
                    _chatService.GetActiveUsersInRoom(user.CurrentRoom));
            }
            
            await base.OnDisconnectedAsync(exception);
        }

        /// <summary>
        /// Called by clients to join the chat with a specific username and room.
        /// </summary>
        public async Task JoinChat(string username, string room)
        {
            // Store the user with their room
            _chatService.UserJoined(Context.ConnectionId, username, room);
            
            // Add this connection to the SignalR group for the room
            await Groups.AddToGroupAsync(Context.ConnectionId, room);
            
            // Send recent message history for this room to the newly connected client
            var history = _chatService.GetRecentMessages(room);
            await Clients.Caller.SendAsync("ReceiveMessageHistory", history);
            
            // Send available rooms and current room to the client
            var rooms = _chatService.GetAvailableRooms();
            await Clients.Caller.SendAsync("ReceiveRooms", rooms, room);
            
            // Broadcast to everyone in the room that a new user joined
            await Clients.Group(room).SendAsync("UserJoined", username);
            
            // Update the user list for everyone in the room
            await Clients.Group(room).SendAsync("UpdateUserList", 
                _chatService.GetActiveUsersInRoom(room));
        }

        /// <summary>
        /// Called by clients to change to a different room.
        /// </summary>
        public async Task ChangeRoom(string username, string newRoom)
        {
            var user = _chatService.GetUserByConnectionId(Context.ConnectionId);
            if (user == null) return;

            string oldRoom = user.CurrentRoom;
            
            // Remove from old room group
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, oldRoom);
            
            // Update user's room
            _chatService.UserChangedRoom(Context.ConnectionId, newRoom);
            
            // Add to new room group
            await Groups.AddToGroupAsync(Context.ConnectionId, newRoom);
            
            // Notify old room that user left
            await Clients.Group(oldRoom).SendAsync("UserLeft", username);
            await Clients.Group(oldRoom).SendAsync("UpdateUserList", 
                _chatService.GetActiveUsersInRoom(oldRoom));
            
            // Send new room history and rooms list to the client
            var history = _chatService.GetRecentMessages(newRoom);
            await Clients.Caller.SendAsync("ReceiveMessageHistory", history);
            
            var rooms = _chatService.GetAvailableRooms();
            await Clients.Caller.SendAsync("ReceiveRooms", rooms, newRoom);
            
            // Notify new room that user joined
            await Clients.Group(newRoom).SendAsync("UserJoined", username);
            await Clients.Group(newRoom).SendAsync("UpdateUserList", 
                _chatService.GetActiveUsersInRoom(newRoom));
        }

        /// <summary>
        /// Called by clients to send a message to the current room.
        /// </summary>
        public async Task SendMessage(string username, string message)
        {
            var user = _chatService.GetUserByConnectionId(Context.ConnectionId);
            if (user == null) return;

            // Use the service to store the message with room information
            var chatMessage = _chatService.CreateAndStoreMessage(username, message, user.CurrentRoom);
            
            // Clear typing indicator in the room
            await Clients.Group(user.CurrentRoom).SendAsync("UserStoppedTyping", username);
            
            // Broadcast the message only to the room group
            await Clients.Group(user.CurrentRoom).SendAsync("ReceiveMessage", chatMessage);
        }

        /// <summary>
        /// Called by clients to notify that they're typing in the current room.
        /// </summary>
        public async Task NotifyTyping(string username)
        {
            var user = _chatService.GetUserByConnectionId(Context.ConnectionId);
            if (user == null) return;

            // Broadcast to other clients in the same room
            await Clients.GroupExcept(user.CurrentRoom, Context.ConnectionId)
                .SendAsync("UserIsTyping", username);
        }

        /// <summary>
        /// Called by clients to clear the typing indicator in the current room.
        /// </summary>
        public async Task NotifyStoppedTyping(string username)
        {
            var user = _chatService.GetUserByConnectionId(Context.ConnectionId);
            if (user == null) return;

            await Clients.GroupExcept(user.CurrentRoom, Context.ConnectionId)
                .SendAsync("UserStoppedTyping", username);
        }
    }
}