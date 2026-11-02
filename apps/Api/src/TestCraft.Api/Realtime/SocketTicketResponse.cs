namespace TestCraft.Api.Realtime;

/// <summary>A ticket for opening a live-update WebSocket.</summary>
public sealed record SocketTicketResponse
{
    /// <summary>Single-use WebSocket ticket, valid for 30 seconds.</summary>
    public required string Ticket { get; init; }
}
