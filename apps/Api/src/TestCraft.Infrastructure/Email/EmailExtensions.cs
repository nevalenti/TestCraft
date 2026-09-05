using Microsoft.Extensions.DependencyInjection;

using TestCraft.Application.Common.Interfaces;
using TestCraft.Infrastructure.Configuration;

namespace TestCraft.Infrastructure.Email;

public static class EmailExtensions
{
    public static IServiceCollection AddEmail(
        this IServiceCollection services,
        InfrastructureOptions options
    )
    {
        if (options.IsSmtpConfigured)
        {
            services.AddScoped<IEmailService, MailKitEmailService>();
        }
        else
        {
            services.AddScoped<IEmailService, NoOpEmailService>();
        }

        return services;
    }
}
