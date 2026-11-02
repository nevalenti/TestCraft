using System.ComponentModel.DataAnnotations;
using MediatR;
using Microsoft.AspNetCore.Mvc;
using TestCraft.Api.Errors;
using TestCraft.Api.Middleware;
using TestCraft.Application.Features.Users;

namespace TestCraft.Api.Features.Users;

[Route("api/v{version:apiVersion}/account")]
public class UsersController(ISender sender) : ApiControllerBase
{
    /// <summary>Returns a presigned URL for the current user's avatar.</summary>
    [HttpGet("avatar")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<ActionResult<AvatarUrlResponse>> GetAvatarUrl(
        CancellationToken cancellationToken
    )
    {
        var query = new GetAvatarUrl.Query();

        return Ok(await sender.Send(query, cancellationToken));
    }

    /// <summary>Uploads a new avatar for the current user.</summary>
    [HttpPut("avatar")]
    [RequestSizeLimit(
        Application.Features.Users.UploadAvatar.MaxSizeBytes
            + MaxBodySizeMiddleware.MultipartOverheadBytes
    )]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<ActionResult<AvatarUrlResponse>> UploadAvatar(
        [Required] IFormFile file,
        CancellationToken cancellationToken
    )
    {
        if (file.Length > Application.Features.Users.UploadAvatar.MaxSizeBytes)
        {
            return new ProblemResult(Problems.ContentTooLarge());
        }

        await using var stream = file.OpenReadStream();

        var command = new UploadAvatar.Command
        {
            FileName = file.FileName,
            ContentType = file.ContentType,
            SizeBytes = file.Length,
            Content = stream,
        };

        var result = await sender.Send(command, cancellationToken);

        return Ok(result);
    }
}
