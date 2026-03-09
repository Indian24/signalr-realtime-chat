using System.Collections.Generic;
using SignalRChat.Models;

namespace SignalRChat.Services
{
    /// <summary>
    /// Interface defining the core business logic for the chat application.
    /// Abstracting this allows for easier testing and dependency injection.
    /// </summary>
    public interface IChatService
    {
        void UserJoined(string connectionId, string username, string room);
        void UserLeft(string connectionId);
        void UserChangedRoom(string connectionId, string newRoom);
        User? GetUserByConnectionId(string connectionId);
        User? GetUserByUsername(string username);
        string? GetConnectionIdByUsername(string username);
        ChatMessage CreateAndStoreMessage(string username, string content, string room);
        ChatMessage CreateAndStorePrivateMessage(string sender, string recipient, string content);
        IEnumerable<ChatMessage> GetRecentMessages(string room);
        IEnumerable<User> GetActiveUsersInRoom(string room);
        IEnumerable<User> GetAllActiveUsers();
        string[] GetAvailableRooms();
    }
}