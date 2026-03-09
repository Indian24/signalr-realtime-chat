using System.Collections.Concurrent;
using SignalRChat.Models;

namespace SignalRChat.Data
{
    /// <summary>
    /// A lightweight in-memory store for keeping track of users and messages.
    /// In a real application, this would be replaced by a database (e.g., SQL Server, Redis).
    /// </summary>
    public class ChatMemoryStore
    {
        // Thread-safe dictionary to store active users by connection ID
        public ConcurrentDictionary<string, User> ActiveUsers { get; } = new();

        // Thread-safe collection for message history
        // Using ConcurrentQueue to ensure thread safety when adding messages
        public ConcurrentQueue<ChatMessage> RecentMessages { get; } = new();
        
        /// <summary>
        /// Maximum number of recent messages to keep in memory.
        /// Increased to 200 for a richer chat history while maintaining reasonable memory usage.
        /// </summary>
        private const int MaxMessageHistory = 200;

        /// <summary>
        /// Adds a message to the history, ensuring we don't exceed the maximum capacity.
        /// This prevents unbounded memory growth in long-running chat sessions.
        /// </summary>
        public void AddMessage(ChatMessage message)
        {
            RecentMessages.Enqueue(message);
            
            // Keep only the recent messages to avoid memory leaks
            while (RecentMessages.Count > MaxMessageHistory)
            {
                RecentMessages.TryDequeue(out _);
            }
        }
    }
}