using Api.Configuration.Infrastructure;
using Api.Configuration.Web;

using Serilog;

namespace Api.Configuration;

public static class Pipeline
{
    public static async Task<WebApplication> ConfigurePipeline(this WebApplication app)
    {
        if (app.Configuration.GetValue<bool>("ApplyMigrations"))
        {
            await app.ApplyMigrations();
        }

        app.UseExceptionHandler();
        app.UseStatusCodePages();

        app.UseSerilogRequestLogging();

        if (app.Environment.IsDevelopment())
        {
            app.UseApiDocumentation();
        }
        else
        {
            app.UseHttpsRedirection();
        }

        app.UseRouting();
        app.UseCorsPolicy();

        app.MapControllers();

        return app;
    }
}