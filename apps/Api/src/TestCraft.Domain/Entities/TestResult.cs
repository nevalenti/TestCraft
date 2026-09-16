using TestCraft.Domain.Enums;

namespace TestCraft.Domain.Entities;

public class TestResult : SoftDeletableEntity
{
    public TestResultId Id { get; private set; }
    public TestResultStatus Status { get; private set; }
    public string? Notes { get; private set; }
    public long? DurationMs { get; private set; }
    public DefectType? DefectType { get; private set; }
    public DateTimeOffset ExecutedAt { get; private set; }
    public UserId? ExecutedById { get; private set; }
    public TestRunId TestRunId { get; private set; }
    public TestCaseId TestCaseId { get; private set; }

    public TestRun? TestRun { get; set; }
    public TestCase? TestCase { get; set; }
    public ICollection<Attachment> Attachments { get; set; } = [];

    public static TestResult Create(
        TestRunId testRunId,
        TestCaseId testCaseId,
        TestResultStatus status,
        string? notes,
        DefectType? defectType,
        long? durationMs,
        DateTimeOffset executedAt,
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

    public void Update(TestResultStatus status, string? notes, DefectType? defectType)
    {
        Status = status;
        Notes = notes;
        DefectType = defectType;
    }
}
