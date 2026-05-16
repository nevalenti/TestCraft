using Api.Configuration.Infrastructure;
using Api.Configuration.Web;

using Application.Projects;

using FluentValidation;
using FluentValidation.AspNetCore;

using Infrastructure.Services;

namespace Api.Configuration;

public static class Services
{
    extension(IServiceCollection services)
    {
        public IServiceCollection ConfigureServices(IConfiguration configuration)
        {
            services.AddDatabase(configuration);

            services.AddCorsPolicy(configuration);
            services.AddApiDocumentation();
            services.AddControllers();

            services.AddFluentValidationAutoValidation();
            services.AddValidatorsFromAssemblyContaining<CreateProjectDtoValidator>();

            services.AddApplicationServices();

            return services;
        }

        private IServiceCollection AddApplicationServices()
        {
            services.AddScoped<IProjectsService, ProjectsService>();

            return services;
        }
    }
}