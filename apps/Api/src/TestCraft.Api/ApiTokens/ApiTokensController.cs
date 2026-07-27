using Asp.Versioning;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TestCraft.Application.ApiTokens;

namespace TestCraft.Api.ApiTokens;

[Authorize]
[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/projects/{projectId:guid}/tokens")]
public class ApiTokensController(ISender sender) : ControllerBase
{
    /// <summary>Lists API tokens for a project.</summary>
    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyList<ApiTokenResponse>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<ApiTokenResponse>>> GetAll(
        Guid projectId,
        CancellationToken cancellationToken
    )
    {
        var query = new GetApiTokens.Query { ProjectId = projectId };
        var result = await sender.Send(query, cancellationToken);

        return Ok(result);
    }

    /// <summary>Creates a new API token. The raw token is returned once — store it securely.</summary>
    [HttpPost]
    [ProducesResponseType(typeof(CreateApiTokenResponse), StatusCodes.Status201Created)]
    public async Task<ActionResult<CreateApiTokenResponse>> Create(
        Guid projectId,
        CreateApiToken.Command command,
        CancellationToken cancellationToken
    )
    {
        var scopedCommand = command with { ProjectId = projectId };
        var result = await sender.Send(scopedCommand, cancellationToken);

        return Created(string.Empty, result);
    }

    /// <summary>Revokes an API token.</summary>
    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> Revoke(
        Guid projectId,
        Guid id,
        CancellationToken cancellationToken
    )
    {
        var command = new RevokeApiToken.Command { ProjectId = projectId, Id = id };
        await sender.Send(command, cancellationToken);

        return NoContent();
    }
}
