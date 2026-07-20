using DotNetEnv;
using TestCraft.Api.Configuration;
using TestCraft.Infrastructure.Configuration;

Env.NoClobber().TraversePath().Load();

var builder = WebApplication.CreateBuilder(args);

builder.ConfigureServices();

var app = builder.Build();

app.Logger.LogStartupConfiguration(
    app.Services.GetRequiredService<KeycloakAuthOptions>(),
    app.Services.GetRequiredService<CorsOptions>(),
    app.Services.GetRequiredService<ApiLoggingOptions>(),
    app.Services.GetRequiredService<DatabaseMigrationOptions>(),
    app.Services.GetRequiredService<MetricsOptions>(),
    app.Services.GetRequiredService<SwaggerBasicAuthOptions>(),
    app.Services.GetRequiredService<InfrastructureOptions>()
);

await app.MigrateDatabaseAsync();

app.ConfigureApplication();

await app.RunAsync();
