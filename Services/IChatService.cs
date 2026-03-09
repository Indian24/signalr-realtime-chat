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
        void UserJoined(string connectionId, string username);
        void UserLeft(string connectionId);
        User? GetUserByConnectionId(string connectionId);
        ChatMessage CreateAndStoreMessage(string username, string content);
        IEnumerable<ChatMessage> GetRecentMessages();
        IEnumerable<User> GetActiveUsers();
    }
}