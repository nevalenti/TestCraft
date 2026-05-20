using Api.Configuration.Infrastructure;
using Api.Configuration.Web;
using Api.Exceptions;

using Application.Projects;
using Application.TestCases;
using Application.TestCaseSteps;
using Application.TestResults;
using Application.TestRuns;
using Application.TestSuites;

using FluentValidation;
using FluentValidation.AspNetCore;

using Infrastructure.Data;
using Infrastructure.Repositories;

namespace Api.Configuration;

public static class Services
{
    extension(IServiceCollection services)
    {
        public IServiceCollection ConfigureServices(IConfiguration configuration)
        {
            services.AddDatabase(configuration);
            services.AddTelemetry(configuration);

            services.AddProblemDetails();
            services.AddExceptionHandler<GlobalExceptionHandler>();

            services.AddControllers();
            services.AddApiVersioningPolicy();

            services.AddFluentValidationAutoValidation();
            services.AddValidatorsFromAssemblyContaining<CreateProjectDtoValidator>();

            services.AddHealthChecks()
                    .AddDbContextCheck<AppDbContext>();

            services.AddCorsPolicy(configuration);
            services.AddApiDocumentation();

            services.AddApplicationServices();

            return services;
        }

        private IServiceCollection AddApplicationServices()
        {
            services.AddScoped<IProjectRepository, ProjectRepository>();
            services.AddScoped<ITestSuiteRepository, TestSuiteRepository>();
            services.AddScoped<ITestCaseRepository, TestCaseRepository>();
            services.AddScoped<ITestCaseStepRepository, TestCaseStepRepository>();
            services.AddScoped<ITestRunRepository, TestRunRepository>();
            services.AddScoped<ITestResultRepository, TestResultRepository>();

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