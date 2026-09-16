using TestCraft.Domain.Common;

namespace TestCraft.Domain.Entities;

public class Attachment
{
    public AttachmentId Id { get; private set; }
    public TestResultId TestResultId { get; private set; }
    public string FileName { get; private set; } = null!;
    public string ContentType { get; private set; } = null!;
    public long SizeBytes { get; private set; }
    public string StorageKey { get; private set; } = null!;

    public UserId CreatedById { get; private set; }
    public DateTimeOffset CreatedAt { get; set; }

    public TestResult? TestResult { get; set; }

    public static Attachment Create(
        TestResultId testResultId,
        string fileName,
        string contentType,
        long sizeBytes,
        string storageKey,
        UserId createdById
    ) =>
        new()
        {
            Id = AttachmentId.New(),
            TestResultId = testResultId,
            FileName = Guard.AgainstEmpty(fileName, nameof(FileName)),
            ContentType = Guard.AgainstEmpty(contentType, nameof(ContentType)),
            SizeBytes = sizeBytes,
            StorageKey = Guard.AgainstEmpty(storageKey, nameof(StorageKey)),
            CreatedById = createdById,
        };
}
