using System;

namespace SignalRChat.Models
{
    /// <summary>
    /// Represents a message sent in the chat.
    /// Can be a public message in a room or a private message to a specific user.
    /// </summary>
    public class ChatMessage
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public string Sender { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;
        public string Room { get; set; } = "general";
        public string? Recipient { get; set; } = null; // null = public message, filled = private message
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
        public bool IsPrivate => !string.IsNullOrEmpty(Recipient);
    }
}