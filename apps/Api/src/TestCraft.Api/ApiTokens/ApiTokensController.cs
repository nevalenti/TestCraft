using Asp.Versioning;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TestCraft.Application.ApiTokens;
using TestCraft.Application.ApiTokens.Commands.CreateApiToken;
using TestCraft.Application.ApiTokens.Commands.RevokeApiToken;
using TestCraft.Application.ApiTokens.Queries.GetApiTokens;

namespace TestCraft.Api.ApiTokens;

[Authorize]
[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/projects/{projectId:guid}/tokens")]
public class ApiTokensController(ISender sender) : ControllerBase
{
    /// <summary>Lists API tokens for a project.</summary>
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<ApiTokenResponse>>> GetAll(
        Guid projectId,
        CancellationToken cancellationToken
    ) => Ok(await sender.Send(new GetApiTokensQuery { ProjectId = projectId }, cancellationToken));

    /// <summary>Creates a new API token. The raw token is returned once — store it securely.</summary>
    [HttpPost]
    public async Task<ActionResult<CreateApiTokenResponse>> Create(
        Guid projectId,
        CreateApiTokenCommand command,
        CancellationToken cancellationToken
    )
    {
        var result = await sender.Send(command with { ProjectId = projectId }, cancellationToken);

        return Created(string.Empty, result);
    }

    /// <summary>Revokes an API token.</summary>
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Revoke(
        Guid projectId,
        Guid id,
        CancellationToken cancellationToken
    )
    {
        await sender.Send(
            new RevokeApiTokenCommand { ProjectId = projectId, Id = id },
            cancellationToken
        );

        return NoContent();
    }
}
