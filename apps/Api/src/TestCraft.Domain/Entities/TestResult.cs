using TestCraft.Domain.Enums;

namespace TestCraft.Domain.Entities;

public class TestResult : SoftDeletableEntity, IVersioned
{
    public TestResultId Id { get; private set; }
    public int Version { get; private set; } = 1;
    public TestResultStatus Status { get; private set; }
    public string? Notes { get; private set; }
    public long? DurationMs { get; private set; }
    public DefectType? DefectType { get; private set; }
    public DateTimeOffset? ExecutedAt { get; private set; }
    public UserId? ExecutedById { get; private set; }
    public TestRunId TestRunId { get; private set; }
    public TestCaseId TestCaseId { get; private set; }

    public TestRun? TestRun { get; }
    public TestCase? TestCase { get; }
    public ICollection<Attachment> Attachments { get; } = [];

    public static TestResult Create(
        TestRunId testRunId,
        TestCaseId testCaseId,
        TestResultStatus status,
        string? notes,
        DefectType? defectType,
        long? durationMs,
        DateTimeOffset? executedAt,
        UserId? executedById
    ) =>
        new()
        {
            Id = TestResultId.New(),
            TestRunId = testRunId,
            TestCaseId = testCaseId,
            Status = status,
            Notes = notes,
            DefectType = defectType,
            DurationMs = durationMs,
            ExecutedAt = executedAt,
            ExecutedById = executedById,
        };

    public void Update(
        TestResultStatus status,
        string? notes,
        DefectType? defectType,
        DateTimeOffset now,
        UserId? userId
    )
    {
        if (status == TestResultStatus.Untested)
        {
            ExecutedAt = null;
            ExecutedById = null;
            DurationMs = null;
        }
        else if (Status == TestResultStatus.Untested)
        {
            ExecutedAt = now;
            ExecutedById = userId;
        }
        Status = status;
        Notes = notes;
        DefectType = status == TestResultStatus.Failed ? defectType : null;
    }

    public void Record(
        TestResultStatus status,
        string? notes,
        DefectType? defectType,
        long? durationMs,
        DateTimeOffset executedAt,
        UserId? userId
    )
    {
        Status = status;
        Notes = notes;
        DefectType = defectType;
        DurationMs = durationMs;
        ExecutedAt = executedAt;
        ExecutedById = userId;
    }
}
