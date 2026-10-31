using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Infrastructure;

namespace TestCraft.Api.Errors;

public sealed class ProblemClientErrorFactory : IClientErrorFactory
{
    public IActionResult GetClientError(
        ActionContext actionContext,
        IClientErrorActionResult clientError
    )
    {
        return new ProblemResult(
            Problems.ForStatus(clientError.StatusCode ?? StatusCodes.Status500InternalServerError)
        );
    }
}
