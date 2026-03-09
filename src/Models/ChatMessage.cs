using System;

namespace SignalRChat.Models
{
    public class ChatMessage
    {
        public int Id { get; set; }

        public string Sender { get; set; }

        public string Content { get; set; }

        public string Room { get; set; }

        public string Recipient { get; set; }

        public bool IsPrivate { get; set; }

        public DateTime Timestamp { get; set; }
    }
}