using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.OutputCaching;
using TestCraft.Api.Configuration;
using TestCraft.Application.ShareTokens;

namespace TestCraft.Api.ShareTokens;

[AllowAnonymous]
[ApiController]
[Route("api/v1/share")]
public class PublicShareTokensController(ISender sender) : ControllerBase
{
    /// <summary>Returns a shared test run view without authentication.</summary>
    [HttpGet("{token}")]
    [OutputCache(PolicyName = OutputCachingExtensions.PublicSharePolicy)]
    public async Task<ActionResult<SharedRunResponse>> GetByToken(
        string token,
        CancellationToken cancellationToken
    )
    {
        return Ok(await sender.Send(new GetRunByShareToken.Query(token), cancellationToken));
    }
}
