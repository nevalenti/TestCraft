using Api.Configuration.Infrastructure;
using Api.Configuration.Web;

using Application.Projects;

using Asp.Versioning;

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

            services.AddApiVersioning(options =>
            {
                options.DefaultApiVersion = new ApiVersion(1, 0);
                options.AssumeDefaultVersionWhenUnspecified = true;
                options.ReportApiVersions = true;
            })
            .AddMvc()
            .AddApiExplorer(options =>
            {
                options.GroupNameFormat = "'v'VVV";
                options.SubstituteApiVersionInUrl = true;
            });

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