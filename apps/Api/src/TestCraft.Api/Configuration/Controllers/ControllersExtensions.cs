using System.Text.Json.Serialization;
using FluentValidation;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Infrastructure;
using Microsoft.AspNetCore.Mvc.ModelBinding;
using TestCraft.Api.Errors;

namespace TestCraft.Api.Configuration.Controllers;

public static class ControllersExtensions
{
    public static WebApplicationBuilder AddApiControllers(this WebApplicationBuilder builder)
    {
        builder
            .Services.AddControllers(options =>
            {
                options.ModelMetadataDetailsProviders.Add(new SnakeCaseQueryBindingProvider());
                options.ModelBinderProviders.Insert(0, new WireEnumModelBinderProvider());
                options.SuppressImplicitRequiredAttributeForNonNullableReferenceTypes = true;
                options.ModelBindingMessageProvider.SetAttemptedValueIsInvalidAccessor(
                    (value, _) => $"Input '{value}' is not a valid value"
                );
                options.ModelBindingMessageProvider.SetValueMustBeANumberAccessor(_ =>
                    "Input should be a valid number"
                );
            })
            .AddJsonOptions(options =>
            {
                WireFormat.Configure(options.JsonSerializerOptions);
                options.JsonSerializerOptions.UnmappedMemberHandling =
                    JsonUnmappedMemberHandling.Disallow;
            });

        ValidatorOptions.Global.DisplayNameResolver = (_, member, _) =>
            member is null ? null : WireFormat.NamingPolicy.ConvertName(member.Name);

        builder.Services.AddSingleton<IClientErrorFactory, ProblemClientErrorFactory>();

        builder.Services.Configure<ApiBehaviorOptions>(options =>
        {
            options.InvalidModelStateResponseFactory = context =>
            {
                var headers = context
                    .ActionDescriptor.Parameters.Where(parameter =>
                        parameter.BindingInfo?.BindingSource == BindingSource.Header
                    )
                    .Select(parameter => parameter.BindingInfo!.BinderModelName ?? parameter.Name)
                    .ToHashSet(StringComparer.OrdinalIgnoreCase);

                var errors = context
                    .ModelState.Where(entry => entry.Value?.Errors.Count > 0)
                    .SelectMany(entry =>
                        headers.Contains(entry.Key)
                            ? [ValidationErrors.MissingHeader(entry.Key)]
                            : entry.Value!.Errors.SelectMany(error =>
                                ValidationErrors.ForModelState(entry.Key, error.ErrorMessage)
                            )
                    )
                    .DistinctBy(error => (error.Field, error.Message))
                    .ToList();

                var problem = Problems.Validation(errors);

                return new ProblemResult(problem);
            };
        });

        return builder;
    }
}
