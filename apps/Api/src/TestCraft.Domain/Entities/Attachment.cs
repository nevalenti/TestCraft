namespace TestCraft.Domain.Entities;

public class Attachment
{
    public Guid Id { get; set; }
    public Guid TestResultId { get; set; }
    public required string FileName { get; set; }
    public required string ContentType { get; set; }
    public long SizeBytes { get; set; }
    public required string StorageKey { get; set; }

    public Guid CreatedById { get; set; }
    public DateTimeOffset CreatedAt { get; set; }

    public TestResult? TestResult { get; set; }
}
