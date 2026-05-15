using Api.Configuration.Web;

namespace Api.Configuration;

public static class Pipeline
{
    public static WebApplication ConfigurePipeline(this WebApplication app)
    {
        if (!app.Environment.IsDevelopment())
        {
            app.UseHttpsRedirection();
        }
        else
        {
            app.UseApiDocumentation();
        }

        app.UseRouting();
        app.UseCorsPolicy();
        app.MapControllers();

        return app;
    }
}