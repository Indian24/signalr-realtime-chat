namespace SignalRChat.Models
{
    /// <summary>
    /// Represents a user in the chat system.
    /// </summary>
    public class User
    {
        public string Username { get; set; } = string.Empty;
        public string ConnectionId { get; set; } = string.Empty;
        public DateTime JoinedAt { get; set; }
    }
}