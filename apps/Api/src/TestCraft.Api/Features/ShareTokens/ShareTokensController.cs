using Asp.Versioning;

using MediatR;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

using TestCraft.Application.Features.ShareTokens;

namespace TestCraft.Api.Features.ShareTokens;

[Authorize]
[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/projects/{projectId:guid}/runs/{runId:guid}/share")]
public class ShareTokensController(ISender sender) : ControllerBase
{
    /// <summary>Creates a shareable link token for a test run.</summary>
    [HttpPost]
    [ProducesResponseType(typeof(ShareTokenResponse), StatusCodes.Status201Created)]
    public async Task<ActionResult<ShareTokenResponse>> Create(
        ProjectId projectId,
        TestRunId runId,
        CreateShareToken.Command command,
        CancellationToken cancellationToken
    )
    {
        var scopedCommand = command with { ProjectId = projectId, RunId = runId };

        var result = await sender.Send(scopedCommand, cancellationToken);

        return StatusCode(StatusCodes.Status201Created, result);
    }

    /// <summary>Lists all share tokens for a test run.</summary>
    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyList<ShareTokenResponse>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<ShareTokenResponse>>> GetAll(
        ProjectId projectId,
        TestRunId runId,
        CancellationToken cancellationToken
    )
    {
        var query = new GetShareTokens.Query { ProjectId = projectId, RunId = runId };

        var result = await sender.Send(query, cancellationToken);

        return Ok(result);
    }

    /// <summary>Revokes a share token.</summary>
    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> Revoke(
        ProjectId projectId,
        TestRunId runId,
        ShareTokenId id,
        CancellationToken cancellationToken
    )
    {
        var command = new RevokeShareToken.Command
        {
            ProjectId = projectId,
            RunId = runId,
            Id = id,
        };

        await sender.Send(command, cancellationToken);

        return NoContent();
    }
}
