using FluentAssertions;

using MediatR;

using TestCraft.Application.Common.Events;
using TestCraft.Application.Common.Exceptions;
using TestCraft.Application.Features.TestRuns;
using TestCraft.Application.UnitTests.Common.Fakes;
using TestCraft.Domain.Entities;
using TestCraft.Domain.Enums;
using TestCraft.Domain.Events;
using TestCraft.Domain.Exceptions;
using TestCraft.Persistence;

namespace TestCraft.Application.UnitTests.TestRuns;

public class UpdateTestRunHandlerTests
{
    private sealed class RecordingPublisher : IPublisher
    {
        public List<object> PublishedNotifications { get; } = [];

        public Task Publish(object notification, CancellationToken cancellationToken = default)
        {
            PublishedNotifications.Add(notification);
            return Task.CompletedTask;
        }

        public Task Publish<TNotification>(
            TNotification notification,
            CancellationToken cancellationToken = default
        )
            where TNotification : INotification
        {
            PublishedNotifications.Add(notification!);
            return Task.CompletedTask;
        }
    }

    private static async Task<(
        AppDbContext Context,
        TestRun Run,
        RecordingPublisher Publisher
    )> SeedAsync()
    {
        var publisher = new RecordingPublisher();
        var context = TestDbContextFactory.Create(publisher);
        var project = new Project
        {
            Id = ProjectId.New(),
            Name = "Project",
            UserId = UserId.New(),
        };
        var run = new TestRun
        {
            Id = TestRunId.New(),
            Name = "Nightly Run",
            Environment = "ci",
            ProjectId = project.Id,
        };

        context.Projects.Add(project);
        context.TestRuns.Add(run);
        await context.SaveChangesAsync();
        publisher.PublishedNotifications.Clear();

        return (context, run, publisher);
    }

    [Fact]
    public async Task Handle_ValidTransition_UpdatesRunAndPublishesStatusChangedEvent()
    {
        var (context, run, publisher) = await SeedAsync();
        var handler = new UpdateTestRun.Handler(context);

        var command = new UpdateTestRun.Command
        {
            ProjectId = run.ProjectId,
            Id = run.Id,
            Name = "Renamed Run",
            Environment = "staging",
            Status = TestRunStatus.Completed,
        };

        var response = await handler.Handle(command, CancellationToken.None);

        response.Name.Should().Be("Renamed Run");
        response.Environment.Should().Be("staging");
        response.Status.Should().Be(TestRunStatus.Completed);
        publisher
            .PublishedNotifications.Should()
            .ContainSingle()
            .Which.Should()
            .BeOfType<DomainEventNotification<TestRunStatusChangedEvent>>();
    }

    [Fact]
    public async Task Handle_InvalidTransition_ThrowsDomainExceptionAndDoesNotPersistChanges()
    {
        var (context, run, publisher) = await SeedAsync();
        var handler = new UpdateTestRun.Handler(context);
        run.TransitionTo(TestRunStatus.Archived);
        await context.SaveChangesAsync();
        publisher.PublishedNotifications.Clear();

        var command = new UpdateTestRun.Command
        {
            ProjectId = run.ProjectId,
            Id = run.Id,
            Name = run.Name,
            Environment = run.Environment,
            Status = TestRunStatus.Active,
        };

        var act = () => handler.Handle(command, CancellationToken.None);

        await act.Should().ThrowAsync<DomainException>();
        publisher.PublishedNotifications.Should().BeEmpty();
    }

    [Fact]
    public async Task Handle_SameStatus_DoesNotPublishEvent()
    {
        var (context, run, publisher) = await SeedAsync();
        var handler = new UpdateTestRun.Handler(context);

        var command = new UpdateTestRun.Command
        {
            ProjectId = run.ProjectId,
            Id = run.Id,
            Name = run.Name,
            Environment = run.Environment,
            Status = TestRunStatus.Active,
        };

        await handler.Handle(command, CancellationToken.None);

        publisher.PublishedNotifications.Should().BeEmpty();
    }

    [Fact]
    public async Task Handle_RunNotFound_ThrowsNotFoundException()
    {
        var context = TestDbContextFactory.Create();
        var handler = new UpdateTestRun.Handler(context);

        var command = new UpdateTestRun.Command
        {
            ProjectId = ProjectId.New(),
            Id = TestRunId.New(),
            Name = "Run",
            Environment = "ci",
            Status = TestRunStatus.Active,
        };

        var act = () => handler.Handle(command, CancellationToken.None);

        await act.Should().ThrowAsync<NotFoundException>();
    }

    [Fact]
    public async Task Handle_RunBelongsToDifferentProject_ThrowsNotFoundException()
    {
        var (context, run, _) = await SeedAsync();
        var handler = new UpdateTestRun.Handler(context);

        var command = new UpdateTestRun.Command
        {
            ProjectId = ProjectId.New(),
            Id = run.Id,
            Name = run.Name,
            Environment = run.Environment,
            Status = TestRunStatus.Active,
        };

        var act = () => handler.Handle(command, CancellationToken.None);

        await act.Should().ThrowAsync<NotFoundException>();
    }
}
