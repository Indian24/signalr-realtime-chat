using System;
using System.Collections.Generic;
using System.Linq;
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
        private readonly string[] _availableRooms = { "general", "dev", "support", "random" };

        public ChatService(ChatMemoryStore store)
        {
            _store = store;
        }

        public void UserJoined(string connectionId, string username, string room)
        {
            var user = new User
            {
                Username = username,
                ConnectionId = connectionId,
                CurrentRoom = room,
                JoinedAt = DateTime.UtcNow
            };
            
            _store.ActiveUsers.TryAdd(connectionId, user);
        }

        public void UserLeft(string connectionId)
        {
            _store.ActiveUsers.TryRemove(connectionId, out _);
        }

        public void UserChangedRoom(string connectionId, string newRoom)
        {
            if (_store.ActiveUsers.TryGetValue(connectionId, out var user))
            {
                user.CurrentRoom = newRoom;
            }
        }

        public User? GetUserByConnectionId(string connectionId)
        {
            _store.ActiveUsers.TryGetValue(connectionId, out var user);
            return user;
        }

        public ChatMessage CreateAndStoreMessage(string username, string content, string room)
        {
            var message = new ChatMessage
            {
                Sender = username,
                Content = content,
                Room = room
            };
            
            _store.AddMessage(message);
            return message;
        }

        public IEnumerable<ChatMessage> GetRecentMessages(string room)
        {
            return _store.RecentMessages.Where(m => m.Room == room);
        }

        public IEnumerable<User> GetActiveUsersInRoom(string room)
        {
            return _store.ActiveUsers.Values.Where(u => u.CurrentRoom == room);
        }

        public string[] GetAvailableRooms()
        {
            return _availableRooms;
        }
    }
}