using Api.Configuration.Infrastructure;
using Api.Configuration.Web;

namespace Api.Configuration;

public static class Services
{
    public static IServiceCollection ConfigureServices(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddDatabase(configuration);
        services.AddCorsPolicy(configuration);
        services.AddApiDocumentation();
        services.AddControllers();

        return services;
    }
}