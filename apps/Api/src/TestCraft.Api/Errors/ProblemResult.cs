using Microsoft.AspNetCore.Mvc;

namespace TestCraft.Api.Errors;

public sealed class ProblemResult(ProblemResponse problem) : ActionResult
{
    public override Task ExecuteResultAsync(ActionContext context) =>
        ProblemWriter.WriteAsync(context.HttpContext, problem);
}
