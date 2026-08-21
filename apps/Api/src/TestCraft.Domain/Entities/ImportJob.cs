using TestCraft.Domain.Enums;

namespace TestCraft.Domain.Entities;

public class ImportJob : IAuditableEntity
{
    public ImportJobId Id { get; set; }
    public ProjectId ProjectId { get; set; }
    public ImportJobStatus Status { get; set; } = ImportJobStatus.Pending;
    public TestRunId? TestRunId { get; set; }
    public string? Error { get; set; }
    public UserId CreatedById { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
}
