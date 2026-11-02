using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.OutputCaching;
using TestCraft.Api.Configuration.OutputCaching;
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
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<ActionResult<SharedRunResponse>> GetByToken(
        string token,
        CancellationToken cancellationToken,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50
    )
    {
        var query = new GetRunByShareToken.Query(token, page, pageSize);

        var result = await sender.Send(query, cancellationToken);

        return Ok(result);
    }
}
