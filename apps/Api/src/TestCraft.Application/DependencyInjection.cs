using FluentValidation;
using Microsoft.Extensions.DependencyInjection;
using TestCraft.Application.Common.Behaviours;
using TestCraft.Application.Common.Pagination;
using TestCraft.Application.Common.Security;

namespace TestCraft.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.AddValidatorsFromAssembly(typeof(DependencyInjection).Assembly);
        services.AddTransient(typeof(IValidator<>), typeof(PageQueryValidator<>));
        services.AddTransient(typeof(IValidator<>), typeof(SearchPageQueryValidator<>));
        services.AddScoped<ProjectAccess>();
        services.AddSingleton(TimeProvider.System);

        services.AddMediatR(config =>
        {
            config
                .RegisterServicesFromAssembly(typeof(DependencyInjection).Assembly)
                .AddOpenBehavior(typeof(PerformanceBehaviour<,>))
                .AddOpenBehavior(typeof(ValidationBehaviour<,>))
                .AddOpenBehavior(typeof(ProjectAuthorizationBehaviour<,>));
        });

        return services;
    }
}
