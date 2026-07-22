using Asp.Versioning;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TestCraft.Application.Notifications;

namespace TestCraft.Api.Notifications;

[Authorize]
[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/projects/{projectId:guid}/notifications")]
public class NotificationsController(ISender sender) : ControllerBase
{
    /// <summary>Lists webhook subscriptions for a project.</summary>
    [HttpGet("webhooks")]
    public async Task<ActionResult<IReadOnlyList<WebhookSubscriptionResponse>>> GetWebhooks(
        Guid projectId,
        CancellationToken cancellationToken
    )
    {
        return Ok(
            await sender.Send(
                new GetWebhookSubscriptions.Query { ProjectId = projectId },
                cancellationToken
            )
        );
    }

    /// <summary>Creates a webhook subscription.</summary>
    [HttpPost("webhooks")]
    public async Task<ActionResult<WebhookSubscriptionResponse>> CreateWebhook(
        Guid projectId,
        CreateWebhookSubscription.Command command,
        CancellationToken cancellationToken
    )
    {
        return Ok(await sender.Send(command with { ProjectId = projectId }, cancellationToken));
    }

    /// <summary>Updates a webhook subscription.</summary>
    [HttpPut("webhooks/{id:guid}")]
    public async Task<ActionResult<WebhookSubscriptionResponse>> UpdateWebhook(
        Guid projectId,
        Guid id,
        UpdateWebhookSubscription.Command command,
        CancellationToken cancellationToken
    )
    {
        return Ok(
            await sender.Send(command with { ProjectId = projectId, Id = id }, cancellationToken)
        );
    }

    /// <summary>Deletes a webhook subscription.</summary>
    [HttpDelete("webhooks/{id:guid}")]
    public async Task<IActionResult> DeleteWebhook(
        Guid projectId,
        Guid id,
        CancellationToken cancellationToken
    )
    {
        await sender.Send(
            new DeleteWebhookSubscription.Command { ProjectId = projectId, Id = id },
            cancellationToken
        );

        return NoContent();
    }

    /// <summary>Lists email subscriptions for a project.</summary>
    [HttpGet("emails")]
    public async Task<ActionResult<IReadOnlyList<EmailSubscriptionResponse>>> GetEmails(
        Guid projectId,
        CancellationToken cancellationToken
    )
    {
        return Ok(
            await sender.Send(
                new GetEmailSubscriptions.Query { ProjectId = projectId },
                cancellationToken
            )
        );
    }

    /// <summary>Creates an email subscription.</summary>
    [HttpPost("emails")]
    public async Task<ActionResult<EmailSubscriptionResponse>> CreateEmail(
        Guid projectId,
        CreateEmailSubscription.Command command,
        CancellationToken cancellationToken
    )
    {
        return Ok(await sender.Send(command with { ProjectId = projectId }, cancellationToken));
    }

    /// <summary>Updates an email subscription.</summary>
    [HttpPut("emails/{id:guid}")]
    public async Task<ActionResult<EmailSubscriptionResponse>> UpdateEmail(
        Guid projectId,
        Guid id,
        UpdateEmailSubscription.Command command,
        CancellationToken cancellationToken
    )
    {
        return Ok(
            await sender.Send(command with { ProjectId = projectId, Id = id }, cancellationToken)
        );
    }

    /// <summary>Deletes an email subscription.</summary>
    [HttpDelete("emails/{id:guid}")]
    public async Task<IActionResult> DeleteEmail(
        Guid projectId,
        Guid id,
        CancellationToken cancellationToken
    )
    {
        await sender.Send(
            new DeleteEmailSubscription.Command { ProjectId = projectId, Id = id },
            cancellationToken
        );

        return NoContent();
    }
}
