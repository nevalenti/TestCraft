using Api.Configuration.Infrastructure;
using Api.Configuration.Web;
using Api.Exceptions;

using Application.Projects;
using Application.TestCases;
using Application.TestCaseSteps;
using Application.TestResults;
using Application.TestRuns;
using Application.TestSuites;

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

            services.AddProblemDetails();
            services.AddExceptionHandler<GlobalExceptionHandler>();

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
            services.AddScoped<ITestSuitesService, TestSuitesService>();
            services.AddScoped<ITestCasesService, TestCasesService>();
            services.AddScoped<ITestCaseStepsService, TestCaseStepsService>();
            services.AddScoped<ITestRunsService, TestRunsService>();
            services.AddScoped<ITestResultsService, TestResultsService>();

            return services;
        }
    }
}