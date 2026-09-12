using DotNetEnv;
using TestCraft.Api.Configuration;
using TestCraft.Api.Configuration.Database;
using TestCraft.Infrastructure.Configuration;

Env.NoClobber().TraversePath().Load();

var builder = WebApplication.CreateBuilder(args);

builder.ConfigureServices();

var app = builder.Build();

var loggerFactory = app.Services.GetRequiredService<ILoggerFactory>();
loggerFactory
    .CreateLogger(typeof(StartupConfigurationLogging))
    .LogStartupConfiguration(app.Services);
loggerFactory
    .CreateLogger(typeof(InfrastructureFallbackLogging))
    .LogInfrastructureFallbacks(app.Services.GetRequiredService<InfrastructureOptions>());

await app.MigrateDatabaseAsync();
await app.SeedDevelopmentDataAsync();

app.ConfigurePipeline();

await app.RunAsync();
