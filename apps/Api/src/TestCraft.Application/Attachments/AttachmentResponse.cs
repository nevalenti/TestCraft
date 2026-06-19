namespace TestCraft.Application.Attachments;

public record AttachmentResponse
{
    public required Guid Id { get; init; }
    public required Guid TestResultId { get; init; }
    public required string FileName { get; init; }
    public required string ContentType { get; init; }
    public required long SizeBytes { get; init; }
    public required DateTimeOffset CreatedAt { get; init; }
}

public record AttachmentDownloadUrlResponse
{
    public required string Url { get; init; }
}
