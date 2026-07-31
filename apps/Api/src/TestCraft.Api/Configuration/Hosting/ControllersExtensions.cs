using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Mvc;
using TestCraft.Api.Errors;

namespace TestCraft.Api.Configuration.Hosting;

public static class ControllersExtensions
{
    public static WebApplicationBuilder AddApiControllers(this WebApplicationBuilder builder)
    {
        builder
            .Services.AddControllers()
            .AddJsonOptions(options =>
            {
                options.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
                options.JsonSerializerOptions.DefaultIgnoreCondition =
                    JsonIgnoreCondition.WhenWritingNull;
                options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
            });

        builder.Services.Configure<ApiBehaviorOptions>(options =>
        {
            options.InvalidModelStateResponseFactory = context =>
            {
                var errors = context
                    .ModelState.Where(entry => entry.Value?.Errors.Count > 0)
                    .SelectMany(entry =>
                        entry.Value!.Errors.Select(error => new FieldError(
                            FieldNameConverter.ToCamelCase(entry.Key),
                            error.ErrorMessage
                        ))
                    )
                    .ToList();

                var problem = Problems.Validation(errors);

                return new JsonResult(problem)
                {
                    StatusCode = problem.Status,
                    ContentType = "application/problem+json",
                };
            };
        });

        return builder;
    }
}
