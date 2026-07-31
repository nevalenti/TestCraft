using Asp.Versioning;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TestCraft.Application.Features.Users;

namespace TestCraft.Api.Features.Users;

[Authorize]
[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/account")]
public class UsersController(ISender sender) : ControllerBase
{
    /// <summary>Returns a presigned URL for the current user's avatar.</summary>
    [HttpGet("avatar")]
    [ProducesResponseType(typeof(AvatarUrlResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> GetAvatarUrl(CancellationToken cancellationToken)
    {
        var query = new GetAvatarUrl.Query();
        var result = await sender.Send(query, cancellationToken);
        if (result is null)
            return NoContent();

        return Ok(result);
    }

    /// <summary>Uploads a new avatar for the current user.</summary>
    [HttpPut("avatar")]
    [RequestSizeLimit(5_242_880)]
    [ProducesResponseType(typeof(AvatarUrlResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<AvatarUrlResponse>> UploadAvatar(
        IFormFile file,
        CancellationToken cancellationToken
    )
    {
        await using var stream = file.OpenReadStream();

        var command = new UploadAvatar.Command
        {
            FileName = file.FileName,
            ContentType = file.ContentType,
            Content = stream,
        };
        var result = await sender.Send(command, cancellationToken);

        return Ok(result);
    }
}
