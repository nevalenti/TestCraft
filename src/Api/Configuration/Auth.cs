using Microsoft.AspNetCore.Authentication.JwtBearer;

namespace Api.Configuration.Web;

public static class Auth
{
    public static IServiceCollection AddKeycloakAuthentication(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        var authority = configuration["Keycloak:Authority"]!;
        var audience = configuration["Keycloak:Audience"]!;
        var requireHttps = configuration.GetValue<bool>("Keycloak:RequireHttpsMetadata");

        services
            .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
            .AddJwtBearer(options =>
            {
                options.MetadataAddress = $"{authority}/.well-known/openid-configuration";
                options.RequireHttpsMetadata = requireHttps;
                options.Audience = audience;
                options.TokenValidationParameters.ValidateIssuer = false;
            });

        services.AddAuthorization();

        return services;
    }
}