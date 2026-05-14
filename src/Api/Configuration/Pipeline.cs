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
            app.MapOpenApi();
        }

        app.UseCors("AllowReactApp");

        app.UseRouting();

        app.MapControllers();

        return app;
    }
}