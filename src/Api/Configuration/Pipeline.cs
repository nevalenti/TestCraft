using Api.Configuration.Web;

namespace Api.Configuration;

public static class Pipeline
{
    public static WebApplication ConfigurePipeline(this WebApplication app)
    {
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