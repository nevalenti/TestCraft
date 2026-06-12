using TestCraft.Domain.Enums;

namespace TestCraft.Domain.Entities;

public class ImportJob : IAuditableEntity
{
    public Guid Id { get; set; }
    public Guid ProjectId { get; set; }
    public ImportJobStatus Status { get; set; } = ImportJobStatus.Pending;
    public Guid? TestRunId { get; set; }
    public string? Error { get; set; }
    public Guid CreatedById { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
}
