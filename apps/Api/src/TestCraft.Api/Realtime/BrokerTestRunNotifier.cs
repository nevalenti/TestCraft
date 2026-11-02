using System.Text.Json;
using Microsoft.Extensions.Options;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Features.TestResults;
using TestCraft.Domain.Enums;

namespace TestCraft.Api.Realtime;

public sealed class BrokerTestRunNotifier(
    IRunEventPublisher publisher,
    IOptions<Microsoft.AspNetCore.Mvc.JsonOptions> jsonOptions
) : ITestRunNotifier
{
    private const int MaxInlineLogCharacters = 64_000;

    private readonly JsonSerializerOptions _serializerOptions = jsonOptions
        .Value
        .JsonSerializerOptions;

    public Task ResultAddedAsync(
        TestRunId runId,
        TestResultResponse result,
        CancellationToken cancellationToken = default
    ) => PublishAsync(runId, "result.added", result);

    public Task ResultUpdatedAsync(
        TestRunId runId,
        TestResultResponse result,
        CancellationToken cancellationToken = default
    ) => PublishAsync(runId, "result.updated", result);

    public Task ResultDeletedAsync(
        TestRunId runId,
        TestResultId resultId,
        CancellationToken cancellationToken = default
    ) => PublishAsync(runId, "result.deleted", resultId);

    public Task RunStatusChangedAsync(
        TestRunId runId,
        TestRunStatus newStatus,
        CancellationToken cancellationToken = default
    ) => PublishAsync(runId, "run.status_changed", newStatus);

    public Task LogsAppendedAsync(
        TestRunId runId,
        IReadOnlyList<string> lines,
        long lastSeq,
        CancellationToken cancellationToken = default
    ) =>
        PublishAsync(
            runId,
            "logs.appended",
            new LogsAppended(
                lines.Count,
                lastSeq,
                lines.Sum(line => line.Length) <= MaxInlineLogCharacters ? lines : null
            )
        );

    public Task DashboardChangedAsync(
        ProjectId projectId,
        TestRunId runId,
        CancellationToken cancellationToken = default
    ) =>
        publisher.PublishDashboardAsync(
            projectId,
            Serialize("run.changed", new RunChanged(projectId, runId))
        );

    private Task PublishAsync<T>(TestRunId runId, string eventName, T data) =>
        publisher.PublishRunAsync(runId, Serialize(eventName, data));

    private string Serialize<T>(string eventName, T data) =>
        JsonSerializer.Serialize(new SocketMessage<T>(eventName, data), _serializerOptions);

    private sealed record SocketMessage<T>(string Event, T Data);

    private sealed record LogsAppended(int Count, long LastSeq, IReadOnlyList<string>? Lines);

    private sealed record RunChanged(ProjectId ProjectId, TestRunId RunId);
}
