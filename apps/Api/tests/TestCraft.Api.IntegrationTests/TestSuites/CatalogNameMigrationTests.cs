using FluentAssertions;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Npgsql;
using TestCraft.Api.IntegrationTests.Infrastructure;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Persistence;

namespace TestCraft.Api.IntegrationTests.TestSuites;

[Collection(ApiCollection.Name)]
public class CatalogNameMigrationTests(ApiFactory factory)
{
    [Fact]
    public async Task Migration_ExplainsExistingDuplicateActiveNames()
    {
        using var scope = factory.Services.CreateScope();
        var currentContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var databaseName = $"legacy_catalog_{Guid.NewGuid():N}";
        var connection = new NpgsqlConnectionStringBuilder(
            currentContext.Database.GetDbConnection().ConnectionString
        );
        var adminConnection = new NpgsqlConnectionStringBuilder(connection.ConnectionString)
        {
            Database = "postgres",
            Pooling = false,
        };
        await using var admin = new NpgsqlConnection(adminConnection.ConnectionString);
        await admin.OpenAsync();

        await using (var create = new NpgsqlCommand($"CREATE DATABASE {databaseName}", admin))
        {
            await create.ExecuteNonQueryAsync();
        }

        try
        {
            connection.Database = databaseName;
            connection.Pooling = false;
            var options = new DbContextOptionsBuilder<AppDbContext>()
                .UseNpgsql(connection.ConnectionString)
                .Options;
            await using var context = new AppDbContext(
                options,
                scope.ServiceProvider.GetRequiredService<IPublisher>(),
                TimeProvider.System
            );
            await context.Database.MigrateAsync("20261022122305_HashShareTokens");

            var projectId = Guid.NewGuid();
            await context.Database.ExecuteSqlInterpolatedAsync(
                $"INSERT INTO projects (id, name, user_id) VALUES ({projectId}, 'Legacy catalog', {Guid.NewGuid()})"
            );
            await context.Database.ExecuteSqlInterpolatedAsync(
                $"INSERT INTO test_suites (project_id, name) VALUES ({projectId}, 'Duplicate'), ({projectId}, 'Duplicate')"
            );

            var migrate = () => context.Database.MigrateAsync();
            var error = await migrate.Should().ThrowAsync<PostgresException>();
            error.Which.Message.Should().Contain("Resolve duplicate active test suite names");
            error.Which.Message.Should().Contain("Duplicate");
        }
        finally
        {
            await using var drop = new NpgsqlCommand(
                $"DROP DATABASE {databaseName} WITH (FORCE)",
                admin
            );
            await drop.ExecuteNonQueryAsync();
        }
    }
}
