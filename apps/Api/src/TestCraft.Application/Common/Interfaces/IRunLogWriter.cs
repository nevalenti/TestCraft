namespace TestCraft.Application.Common.Interfaces;

public interface IRunLogWriter
{
    Task<long> AppendAsync(
        TestRunId runId,
        IReadOnlyList<string> lines,
        CancellationToken cancellationToken
    );
}
