using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Npgsql;
using Testcontainers.PostgreSql;
using Testcontainers.Redis;
using TestCraft.Api.Realtime;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Persistence;

namespace TestCraft.Api.IntegrationTests.Infrastructure;

public class ApiFactory : WebApplicationFactory<Program>, IAsyncLifetime
{
    private static readonly string[] ExternalServiceSettings =
    [
        "RABBITMQ_URL",
        "SMTP_HOST",
        "LOKI_URL",
        "OTEL_EXPORTER_OTLP_ENDPOINT",
    ];

    private readonly PostgreSqlContainer _postgres = new PostgreSqlBuilder(
        "postgres:16-alpine"
    ).Build();

    private readonly RedisContainer _redis = new RedisBuilder("redis:7-alpine").Build();

    public async Task InitializeAsync()
    {
        await Task.WhenAll(_postgres.StartAsync(), _redis.StartAsync());

        Environment.SetEnvironmentVariable(
            "DATABASE_URL",
            ToDatabaseUrl(_postgres.GetConnectionString())
        );
        Environment.SetEnvironmentVariable("REDIS_URL", $"redis://{_redis.GetConnectionString()}");
        Environment.SetEnvironmentVariable(
            "KEYCLOAK_AUTHORITY",
            "https://keycloak.invalid/realms/testcraft"
        );
        Environment.SetEnvironmentVariable("KEYCLOAK_AUDIENCE", "testcraft-web");
        Environment.SetEnvironmentVariable("KEYCLOAK_ADMIN_CLIENT_ID", "testcraft-admin-test");
        Environment.SetEnvironmentVariable("KEYCLOAK_ADMIN_CLIENT_SECRET", "test-secret");

        using var scope = Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        await dbContext.Database.MigrateAsync();
    }

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");

        foreach (var key in ExternalServiceSettings)
        {
            builder.UseSetting(key, string.Empty);
        }

        builder.ConfigureLogging(logging =>
        {
            logging.ClearProviders();
        });

        builder.ConfigureServices(services =>
        {
            services.PostConfigure<AuthenticationOptions>(options =>
            {
                options.DefaultAuthenticateScheme = TestAuthHandler.SchemeName;
                options.DefaultChallengeScheme = TestAuthHandler.SchemeName;
                options.DefaultScheme = TestAuthHandler.SchemeName;
            });

            services
                .AddAuthentication(TestAuthHandler.SchemeName)
                .AddScheme<AuthenticationSchemeOptions, TestAuthHandler>(
                    TestAuthHandler.SchemeName,
                    _ => { }
                );

            services.AddSingleton<IStorageService, FakeStorageService>();
            services.AddSingleton<IKeycloakUserDirectory, FakeKeycloakUserDirectory>();
            services.AddSingleton<FakeEmailService>();
            services.AddSingleton<IEmailService>(provider =>
                provider.GetRequiredService<FakeEmailService>()
            );
            services.AddSingleton<FakeTestRunNotifier>(provider => new FakeTestRunNotifier(
                ActivatorUtilities.CreateInstance<BrokerTestRunNotifier>(provider)
            ));
            services.AddSingleton<ITestRunNotifier>(provider =>
                provider.GetRequiredService<FakeTestRunNotifier>()
            );
        });
    }

    public void RegisterUser(
        string email,
        Guid userId,
        string? displayName = null,
        bool emailVerified = true
    ) =>
        ((FakeKeycloakUserDirectory)Services.GetRequiredService<IKeycloakUserDirectory>()).Register(
            email,
            userId,
            displayName,
            emailVerified
        );

    private static string ToDatabaseUrl(string npgsqlConnectionString)
    {
        var builder = new NpgsqlConnectionStringBuilder(npgsqlConnectionString);

        return $"postgresql://{builder.Username}:{builder.Password}@{builder.Host}:{builder.Port}/{builder.Database}";
    }

    public new async Task DisposeAsync()
    {
        await _redis.DisposeAsync();
        await _postgres.DisposeAsync();
        await base.DisposeAsync();
    }
}
