using FluentValidation;

namespace TestCraft.Application.Common.Validation;

public static class FluentValidationExtensions
{
    public static IRuleBuilderOptions<T, TId> NotEmptyId<T, TId>(
        this IRuleBuilder<T, TId> ruleBuilder
    )
        where TId : IEquatable<Guid> => ruleBuilder.Must(id => !id.Equals(Guid.Empty));
}
