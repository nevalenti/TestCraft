namespace TestCraft.Domain.Entities;

public class Attachment
{
    public AttachmentId Id { get; set; }
    public TestResultId TestResultId { get; set; }
    public required string FileName { get; set; }
    public required string ContentType { get; set; }
    public long SizeBytes { get; set; }
    public required string StorageKey { get; set; }

    public UserId CreatedById { get; set; }
    public DateTimeOffset CreatedAt { get; set; }

    public TestResult? TestResult { get; set; }
}
