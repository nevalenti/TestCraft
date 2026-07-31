using Asp.Versioning;

namespace TestCraft.Api.Configuration.Swagger;

public static class ApiVersioningExtensions
{
    public static WebApplicationBuilder AddApiVersioningSupport(this WebApplicationBuilder builder)
    {
        builder
            .Services.AddApiVersioning(options =>
            {
                options.DefaultApiVersion = new ApiVersion(1.0);
                options.AssumeDefaultVersionWhenUnspecified = true;
                options.ReportApiVersions = true;
                options.ApiVersionReader = new UrlSegmentApiVersionReader();
            })
            .AddMvc()
            .AddApiExplorer(options =>
            {
                options.GroupNameFormat = "'v'V";
                options.SubstituteApiVersionInUrl = true;
            });

        return builder;
    }
}
