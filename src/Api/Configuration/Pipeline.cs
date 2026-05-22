using Api.Configuration.Infrastructure;
using Api.Configuration.Web;

using Serilog;

namespace Api.Configuration;

public static class Pipeline
{
    public static async Task<WebApplication> ConfigurePipeline(this WebApplication app)
    {
        var isDevelopment = app.Environment.IsDevelopment();
        var applyMigrations = app.Configuration.GetValue<bool>("ApplyMigrations");

        if (applyMigrations)
        {
            await app.ApplyMigrations();
        }

        var seedData = app.Configuration.GetValue<bool>("SeedData");
        if (seedData)
        {
            await app.SeedData();
        }

        app.UseExceptionHandler();
        app.UseStatusCodePages();

        if (!isDevelopment)
            app.UseHttpsRedirection();

        app.UseSerilogRequestLogging();

        app.UseRouting();
        app.UseCorsPolicy();
        app.UseAuthentication();
        app.UseAuthorization();

        if (isDevelopment)
            app.UseApiDocumentation();

        app.MapControllers().RequireAuthorization();
        app.MapHealthChecks("/health").AllowAnonymous();
        app.MapPrometheusScrapingEndpoint();

        return app;
    }
}