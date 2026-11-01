using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Authorization.Policy;
using TestCraft.Api.Errors;

namespace TestCraft.Api.Authorization;

public sealed class ProblemAuthorizationResultHandler : IAuthorizationMiddlewareResultHandler
{
    private readonly AuthorizationMiddlewareResultHandler _default = new();

    public Task HandleAsync(
        RequestDelegate next,
        HttpContext context,
        AuthorizationPolicy policy,
        PolicyAuthorizationResult authorizeResult
    ) =>
        authorizeResult.Forbidden
            ? authorizeResult.AuthorizationFailure?.FailureReasons.FirstOrDefault() switch
            {
                ProjectNotFoundReason => ProblemWriter.WriteAsync(context, Problems.NotFound()),
                { } reason => ProblemWriter.WriteAsync(
                    context,
                    Problems.Forbidden() with
                    {
                        Detail = reason.Message,
                    }
                ),
                null => _default.HandleAsync(next, context, policy, authorizeResult),
            }
            : _default.HandleAsync(next, context, policy, authorizeResult);
}
