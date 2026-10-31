using FluentValidation;
using FluentValidation.Results;
using MediatR;

namespace TestCraft.Application.Common.Behaviours;

public class ValidationBehaviour<TRequest, TResponse>(IEnumerable<IValidator<TRequest>> validators)
    : IPipelineBehavior<TRequest, TResponse>
    where TRequest : IRequest<TResponse>
{
    public async Task<TResponse> Handle(
        TRequest request,
        RequestHandlerDelegate<TResponse> next,
        CancellationToken cancellationToken
    )
    {
        if (!validators.Any())
        {
            return await next(cancellationToken);
        }

        var failures = new List<ValidationFailure>();
        foreach (var validator in validators)
        {
            var result = await validator.ValidateAsync(
                new ValidationContext<TRequest>(request),
                cancellationToken
            );
            failures.AddRange(result.Errors);
        }

        if (failures.Count > 0)
        {
            throw new ValidationException(failures);
        }

        return await next(cancellationToken);
    }
}
