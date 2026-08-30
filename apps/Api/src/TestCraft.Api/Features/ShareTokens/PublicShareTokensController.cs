using MediatR;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.OutputCaching;

using TestCraft.Api.Configuration.Hosting;
using TestCraft.Application.Features.ShareTokens;

namespace TestCraft.Api.Features.ShareTokens;

[AllowAnonymous]
[ApiController]
[Route("api/v1/share")]
public class PublicShareTokensController(ISender sender) : ControllerBase
{
    /// <summary>Returns a shared test run view without authentication.</summary>
    [HttpGet("{token}")]
    [OutputCache(PolicyName = OutputCachingExtensions.PublicSharePolicy)]
    [ProducesResponseType(typeof(SharedRunResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<SharedRunResponse>> GetByToken(
        string token,
        CancellationToken cancellationToken
    )
    {
        var query = new GetRunByShareToken.Query(token);

        var result = await sender.Send(query, cancellationToken);

        return Ok(result);
    }
}
