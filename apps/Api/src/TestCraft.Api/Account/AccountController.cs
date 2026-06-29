using Asp.Versioning;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TestCraft.Application.Users;

namespace TestCraft.Api.Account;

[Authorize]
[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/account")]
public class AccountController(ISender sender) : ControllerBase
{
    /// <summary>Returns a presigned URL for the current user's avatar.</summary>
    [HttpGet("avatar")]
    public async Task<IActionResult> GetAvatarUrl(CancellationToken cancellationToken)
    {
        var result = await sender.Send(new GetAvatarUrl.Query(), cancellationToken);
        if (result is null)
            return NoContent();

        return Ok(result);
    }

    /// <summary>Uploads a new avatar for the current user.</summary>
    [HttpPut("avatar")]
    [RequestSizeLimit(5_242_880)]
    public async Task<ActionResult<AvatarUrlResponse>> UploadAvatar(
        IFormFile file,
        CancellationToken cancellationToken
    )
    {
        await using var stream = file.OpenReadStream();

        var result = await sender.Send(
            new UploadAvatar.Command
            {
                FileName = file.FileName,
                ContentType = file.ContentType,
                Content = stream,
            },
            cancellationToken
        );

        return Ok(result);
    }
}
