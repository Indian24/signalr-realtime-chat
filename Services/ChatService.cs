using System;
using System.Collections.Generic;
using SignalRChat.Data;
using SignalRChat.Models;

namespace SignalRChat.Services
{
    /// <summary>
    /// Implementation of chat business logic, interacting with the data store.
    /// </summary>
    public class ChatService : IChatService
    {
        private readonly ChatMemoryStore _store;

        public ChatService(ChatMemoryStore store)
        {
            _store = store;
        }

        public void UserJoined(string connectionId, string username)
        {
            var user = new User
            {
                Username = username,
                ConnectionId = connectionId,
                JoinedAt = DateTime.UtcNow
            };
            
            _store.ActiveUsers.TryAdd(connectionId, user);
        }

        public void UserLeft(string connectionId)
        {
            _store.ActiveUsers.TryRemove(connectionId, out _);
        }

        public ChatMessage CreateAndStoreMessage(string username, string content)
        {
            var message = new ChatMessage
            {
                Sender = username,
                Content = content
            };
            
            _store.AddMessage(message);
            return message;
        }

        public IEnumerable<ChatMessage> GetRecentMessages()
        {
            return _store.RecentMessages;
        }

        public IEnumerable<User> GetActiveUsers()
        {
            return _store.ActiveUsers.Values;
        }
    }
}