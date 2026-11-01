using DotNetEnv;
using TestCraft.Api.Configuration;
using TestCraft.Api.Configuration.Database;
using TestCraft.Api.Configuration.Observability;

if (Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") == Environments.Development)
{
    Env.NoClobber().TraversePath().Load();
}

var builder = WebApplication.CreateBuilder(args);

builder.ConfigureServices();

var app = builder.Build();

app.StartErrorTracking();
app.LogStartupConfiguration();

await app.MigrateDatabaseAsync();

app.ConfigurePipeline();

await app.RunAsync();
