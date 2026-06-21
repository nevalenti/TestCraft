using Asp.Versioning;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TestCraft.Application.ShareTokens;

namespace TestCraft.Api.Share;

[Authorize]
[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/projects/{projectId:guid}/runs/{runId:guid}/share")]
public class ShareController(ISender sender) : ControllerBase
{
    /// <summary>Creates a shareable link token for a test run.</summary>
    [HttpPost]
    public async Task<ActionResult<ShareTokenResponse>> Create(
        Guid projectId,
        Guid runId,
        CreateShareToken.Command command,
        CancellationToken cancellationToken
    )
    {
        var result = await sender.Send(
            command with
            {
                ProjectId = projectId,
                RunId = runId,
            },
            cancellationToken
        );

        return Created(string.Empty, result);
    }

    /// <summary>Lists all share tokens for a test run.</summary>
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<ShareTokenResponse>>> GetAll(
        Guid projectId,
        Guid runId,
        CancellationToken cancellationToken
    ) =>
        Ok(
            await sender.Send(
                new GetShareTokens.Query { ProjectId = projectId, RunId = runId },
                cancellationToken
            )
        );

    /// <summary>Revokes a share token.</summary>
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Revoke(
        Guid projectId,
        Guid runId,
        Guid id,
        CancellationToken cancellationToken
    )
    {
        await sender.Send(
            new RevokeShareToken.Command
            {
                ProjectId = projectId,
                RunId = runId,
                Id = id,
            },
            cancellationToken
        );

        return NoContent();
    }
}

[AllowAnonymous]
[ApiController]
[Route("api/v1/share")]
public class PublicShareController(ISender sender) : ControllerBase
{
    /// <summary>Returns a shared test run view without authentication.</summary>
    [HttpGet("{token}")]
    public async Task<ActionResult<SharedRunResponse>> GetByToken(
        string token,
        CancellationToken cancellationToken
    ) => Ok(await sender.Send(new GetRunByShareToken.Query(token), cancellationToken));
}
