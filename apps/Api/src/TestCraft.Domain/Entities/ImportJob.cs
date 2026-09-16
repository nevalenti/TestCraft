using TestCraft.Domain.Enums;
using TestCraft.Domain.Exceptions;

namespace TestCraft.Domain.Entities;

public class ImportJob : AuditableEntity
{
    public ImportJobId Id { get; private set; }
    public ProjectId ProjectId { get; private set; }
    public ImportJobStatus Status { get; private set; } = ImportJobStatus.Pending;
    public TestRunId? TestRunId { get; private set; }
    public string? Error { get; private set; }
    public UserId CreatedById { get; private set; }

    public static ImportJob Create(ProjectId projectId, UserId createdById) =>
        new()
        {
            Id = ImportJobId.New(),
            ProjectId = projectId,
            CreatedById = createdById,
        };

    public bool CanTransitionTo(ImportJobStatus to) =>
        to == Status
        || (Status, to) switch
        {
            (ImportJobStatus.Pending, ImportJobStatus.Processing) => true,
            (ImportJobStatus.Processing, ImportJobStatus.Completed) => true,
            (ImportJobStatus.Processing, ImportJobStatus.Failed) => true,
            _ => false,
        };

    private void TransitionTo(ImportJobStatus to)
    {
        if (!CanTransitionTo(to))
            throw new DomainException(
                $"Cannot transition import job status from {Status} to {to}"
            )
            {
                ErrorCode = DomainErrorCodes.InvalidImportJobStatusTransition,
            };

        Status = to;
    }

    public void MarkProcessing() => TransitionTo(ImportJobStatus.Processing);

    public void MarkCompleted(TestRunId testRunId)
    {
        TransitionTo(ImportJobStatus.Completed);
        TestRunId = testRunId;
    }

    public void MarkFailed(string error)
    {
        TransitionTo(ImportJobStatus.Failed);
        Error = error;
    }
}
