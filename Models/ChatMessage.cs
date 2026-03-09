using System;

namespace SignalRChat.Models
{
    /// <summary>
    /// Represents a message sent in the chat.
    /// </summary>
    public class ChatMessage
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public string Sender { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;
        public string Room { get; set; } = "general";
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    }
}