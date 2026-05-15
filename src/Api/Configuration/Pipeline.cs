using Api.Configuration.Api;

namespace Api.Configuration;

public static class Pipeline
{
    public static WebApplication ConfigurePipeline(this WebApplication app)
    {
        if (!app.Environment.IsDevelopment())
        {
            app.UseHttpsRedirection();
        }

        if (app.Environment.IsDevelopment())
        {
            app.UseOpenApi();
        }

        app.UseRouting();

        app.UseCors("AllowReactApp");

        app.MapControllers();

        return app;
    }
}