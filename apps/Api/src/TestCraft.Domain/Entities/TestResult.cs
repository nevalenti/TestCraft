using TestCraft.Domain.Enums;

namespace TestCraft.Domain.Entities;

public class TestResult : SoftDeletableEntity
{
    public TestResultId Id { get; set; }
    public TestResultStatus Status { get; set; }
    public string? Notes { get; set; }
    public long? DurationMs { get; set; }
    public DefectType? DefectType { get; set; }
    public DateTimeOffset ExecutedAt { get; set; }
    public UserId? ExecutedById { get; set; }
    public TestRunId TestRunId { get; set; }
    public TestCaseId TestCaseId { get; set; }

    public TestRun? TestRun { get; set; }
    public TestCase? TestCase { get; set; }
    public ICollection<Attachment> Attachments { get; set; } = [];

    public void Update(TestResultStatus status, string? notes, DefectType? defectType)
    {
        Status = status;
        Notes = notes;
        DefectType = defectType;
    }
}
