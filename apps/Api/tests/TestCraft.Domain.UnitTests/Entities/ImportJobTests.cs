using FluentAssertions;

using TestCraft.Domain.Entities;
using TestCraft.Domain.Enums;
using TestCraft.Domain.Exceptions;

namespace TestCraft.Domain.UnitTests.Entities;

public class ImportJobTests
{
    [Fact]
    public void Create_StartsPending()
    {
        var projectId = ProjectId.New();
        var createdById = UserId.New();

        var job = ImportJob.Create(projectId, createdById);

        job.ProjectId.Should().Be(projectId);
        job.CreatedById.Should().Be(createdById);
        job.Status.Should().Be(ImportJobStatus.Pending);
        job.TestRunId.Should().BeNull();
        job.Error.Should().BeNull();
    }

    [Fact]
    public void MarkProcessing_SetsStatusToProcessing()
    {
        var job = ImportJob.Create(ProjectId.New(), UserId.New());

        job.MarkProcessing();

        job.Status.Should().Be(ImportJobStatus.Processing);
    }

    [Fact]
    public void MarkCompleted_SetsStatusAndTestRunId()
    {
        var job = ImportJob.Create(ProjectId.New(), UserId.New());
        job.MarkProcessing();
        var runId = TestRunId.New();

        job.MarkCompleted(runId);

        job.Status.Should().Be(ImportJobStatus.Completed);
        job.TestRunId.Should().Be(runId);
    }

    [Fact]
    public void MarkFailed_SetsStatusAndError()
    {
        var job = ImportJob.Create(ProjectId.New(), UserId.New());
        job.MarkProcessing();

        job.MarkFailed("parse error");

        job.Status.Should().Be(ImportJobStatus.Failed);
        job.Error.Should().Be("parse error");
    }

    [Fact]
    public void MarkCompleted_WithoutProcessing_ThrowsDomainException()
    {
        var job = ImportJob.Create(ProjectId.New(), UserId.New());

        var act = () => job.MarkCompleted(TestRunId.New());

        act.Should()
            .Throw<DomainException>()
            .Which.ErrorCode.Should()
            .Be(DomainErrorCodes.InvalidImportJobStatusTransition);
    }

    [Fact]
    public void MarkFailed_WithoutProcessing_ThrowsDomainException()
    {
        var job = ImportJob.Create(ProjectId.New(), UserId.New());

        var act = () => job.MarkFailed("error");

        act.Should().Throw<DomainException>();
    }

    [Fact]
    public void MarkProcessing_OnCompletedJob_ThrowsDomainException()
    {
        var job = ImportJob.Create(ProjectId.New(), UserId.New());
        job.MarkProcessing();
        job.MarkCompleted(TestRunId.New());

        var act = () => job.MarkProcessing();

        act.Should().Throw<DomainException>();
    }

    [Fact]
    public void MarkFailed_CalledTwice_IsIdempotentAndUpdatesError()
    {
        var job = ImportJob.Create(ProjectId.New(), UserId.New());
        job.MarkProcessing();
        job.MarkFailed("first error");

        var act = () => job.MarkFailed("second error");

        act.Should().NotThrow();
        job.Error.Should().Be("second error");
    }
}
