using MediatR;
using Microsoft.AspNetCore.Mvc;
using TestCraft.Api.Authorization;
using TestCraft.Application.Features.ApiTokens;
using TestCraft.Domain.Enums;

namespace TestCraft.Api.Features.ApiTokens;

[ProjectRoles(Read = ProjectRole.Admin, Write = ProjectRole.Admin)]
[Route("api/v{version:apiVersion}/projects/{projectId:guid}/tokens")]
public class ApiTokensController(ISender sender) : ApiControllerBase
{
    /// <summary>Lists API tokens for a project.</summary>
    [HttpGet]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<ApiTokenResponse>>> GetAll(
        ProjectId projectId,
        CancellationToken cancellationToken
    ) => Ok(await sender.Send(new GetApiTokens.Query { ProjectId = projectId }, cancellationToken));

    /// <summary>Creates a new API token. The raw token is returned once — store it securely.</summary>
    [HttpPost]
    [ProducesResponseType(StatusCodes.Status201Created)]
    public async Task<ActionResult<CreateApiTokenResponse>> Create(
        ProjectId projectId,
        CreateApiToken.Command command,
        CancellationToken cancellationToken
    )
    {
        var result = await sender.Send(command with { ProjectId = projectId }, cancellationToken);

        return StatusCode(StatusCodes.Status201Created, result);
    }

    /// <summary>Revokes an API token.</summary>
    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> Revoke(
        ProjectId projectId,
        ApiTokenId id,
        CancellationToken cancellationToken
    )
    {
        await sender.Send(
            new RevokeApiToken.Command { ProjectId = projectId, Id = id },
            cancellationToken
        );

        return NoContent();
    }
}
