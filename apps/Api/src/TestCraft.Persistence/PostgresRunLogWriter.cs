using Microsoft.EntityFrameworkCore;
using TestCraft.Application.Common.Interfaces;

namespace TestCraft.Persistence;

public sealed class PostgresRunLogWriter(AppDbContext context) : IRunLogWriter
{
    public async Task<long> AppendAsync(
        TestRunId runId,
        IReadOnlyList<string> lines,
        CancellationToken cancellationToken
    )
    {
        var lastSeq = await context
            .Database.SqlQuery<long>(
                $"""
                WITH inserted AS (
                    INSERT INTO run_logs (run_id, message)
                    SELECT {runId.Value}, line.message
                    FROM unnest({lines.ToArray()}) WITH ORDINALITY AS line(message, position)
                    ORDER BY line.position
                    RETURNING seq
                )
                SELECT max(seq) AS "Value" FROM inserted
                """
            )
            .ToListAsync(cancellationToken);

        return lastSeq[0];
    }
}
