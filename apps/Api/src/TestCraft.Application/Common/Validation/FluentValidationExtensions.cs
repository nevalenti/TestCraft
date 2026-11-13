using FluentValidation;

namespace TestCraft.Application.Common.Validation;

public static class FluentValidationExtensions
{
    public static IRuleBuilderOptions<T, TId> NotEmptyId<T, TId>(
        this IRuleBuilder<T, TId> ruleBuilder
    )
        where TId : IEquatable<Guid> => ruleBuilder.Must(id => !id.Equals(Guid.Empty));

    public static IRuleBuilderOptions<T, string?> RequiredName<T>(
        this IRuleBuilder<T, string?> ruleBuilder
    ) => ruleBuilder.NotEmpty().MaximumLength(FieldLengths.Name);

    public static IRuleBuilderOptions<T, string> SingleLine<T>(
        this IRuleBuilder<T, string> ruleBuilder
    ) =>
        ruleBuilder
            .Must(value => value is null || value.IndexOfAny(['\r', '\n']) < 0)
            .WithMessage("'{PropertyName}' must be a single line.");

    public static IRuleBuilderOptions<T, string?> HttpUrl<T>(
        this IRuleBuilder<T, string?> ruleBuilder
    ) =>
        ruleBuilder
            .MaximumLength(FieldLengths.Url)
            .Must(value =>
                value is null
                || (
                    Uri.TryCreate(value, UriKind.Absolute, out var uri)
                    && (uri.Scheme == Uri.UriSchemeHttp || uri.Scheme == Uri.UriSchemeHttps)
                )
            )
            .WithMessage("'{PropertyName}' must be an absolute http or https URL.");
}
