using System;

namespace SignalRChat.Models
{
    public class User
    {
        public int Id { get; set; }

        public string Username { get; set; }

        public string ConnectionId { get; set; }

        public string CurrentRoom { get; set; }

        public DateTime JoinedAt { get; set; }
    }
}