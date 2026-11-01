using FluentAssertions;
using Npgsql;
using TestCraft.Persistence;

namespace TestCraft.Api.IntegrationTests.System;

public class ConnectionStringHelpersTests
{
    [Fact]
    public void Timeouts_SetThePoolWaitAndTheServerStatementTimeout()
    {
        var builder = new NpgsqlConnectionStringBuilder(
            ConnectionStringHelpers.ToNpgsqlConnectionString(
                "postgresql://app:p%40ss@db:5433/testcraft",
                poolTimeoutSeconds: 7,
                statementTimeoutMs: 1500
            )
        );

        builder.Host.Should().Be("db");
        builder.Port.Should().Be(5433);
        builder.Password.Should().Be("p@ss");
        builder.Timeout.Should().Be(7);
        builder.Options.Should().Be("-c statement_timeout=1500");
    }
}
