namespace SignalRChat.Models
{
    /// <summary>
    /// Represents a user in the chat system.
    /// </summary>
    public class User
    {
        public string Username { get; set; } = string.Empty;
        public string ConnectionId { get; set; } = string.Empty;
        public string CurrentRoom { get; set; } = "general";
        public DateTime JoinedAt { get; set; }
    }
}