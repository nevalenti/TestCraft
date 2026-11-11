namespace TestCraft.Persistence;

public sealed class IdempotencyRecord
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public required string Principal { get; set; }
    public required string Key { get; set; }
    public required string RequestHash { get; set; }
    public int? StatusCode { get; set; }
    public byte[]? ResponseBody { get; set; }
    public string? ContentType { get; set; }
    public string? Location { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
}
