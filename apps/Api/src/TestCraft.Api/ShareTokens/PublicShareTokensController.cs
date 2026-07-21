using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TestCraft.Application.ShareTokens;

namespace TestCraft.Api.ShareTokens;

[AllowAnonymous]
[ApiController]
[Route("api/v1/share")]
public class PublicShareTokensController(ISender sender) : ControllerBase
{
    /// <summary>Returns a shared test run view without authentication.</summary>
    [HttpGet("{token}")]
    public async Task<ActionResult<SharedRunResponse>> GetByToken(
        string token,
        CancellationToken cancellationToken
    ) => Ok(await sender.Send(new GetRunByShareToken.Query(token), cancellationToken));
}
