using Asp.Versioning;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TestCraft.Application.Notifications;
using TestCraft.Application.Notifications.Commands.CreateEmailSubscription;
using TestCraft.Application.Notifications.Commands.CreateWebhookSubscription;
using TestCraft.Application.Notifications.Commands.DeleteEmailSubscription;
using TestCraft.Application.Notifications.Commands.DeleteWebhookSubscription;
using TestCraft.Application.Notifications.Commands.UpdateEmailSubscription;
using TestCraft.Application.Notifications.Commands.UpdateWebhookSubscription;
using TestCraft.Application.Notifications.Queries.GetEmailSubscriptions;
using TestCraft.Application.Notifications.Queries.GetWebhookSubscriptions;

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
    ) =>
        Ok(
            await sender.Send(
                new GetWebhookSubscriptionsQuery { ProjectId = projectId },
                cancellationToken
            )
        );

    /// <summary>Creates a webhook subscription.</summary>
    [HttpPost("webhooks")]
    public async Task<ActionResult<WebhookSubscriptionResponse>> CreateWebhook(
        Guid projectId,
        CreateWebhookSubscriptionCommand command,
        CancellationToken cancellationToken
    ) => Ok(await sender.Send(command with { ProjectId = projectId }, cancellationToken));

    /// <summary>Updates a webhook subscription.</summary>
    [HttpPut("webhooks/{id:guid}")]
    public async Task<ActionResult<WebhookSubscriptionResponse>> UpdateWebhook(
        Guid projectId,
        Guid id,
        UpdateWebhookSubscriptionCommand command,
        CancellationToken cancellationToken
    )
    {
        if (id != command.Id)
        {
            return BadRequest();
        }

        return Ok(await sender.Send(command with { ProjectId = projectId }, cancellationToken));
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
            new DeleteWebhookSubscriptionCommand { ProjectId = projectId, Id = id },
            cancellationToken
        );

        return NoContent();
    }

    /// <summary>Lists email subscriptions for a project.</summary>
    [HttpGet("emails")]
    public async Task<ActionResult<IReadOnlyList<EmailSubscriptionResponse>>> GetEmails(
        Guid projectId,
        CancellationToken cancellationToken
    ) =>
        Ok(
            await sender.Send(
                new GetEmailSubscriptionsQuery { ProjectId = projectId },
                cancellationToken
            )
        );

    /// <summary>Creates an email subscription.</summary>
    [HttpPost("emails")]
    public async Task<ActionResult<EmailSubscriptionResponse>> CreateEmail(
        Guid projectId,
        CreateEmailSubscriptionCommand command,
        CancellationToken cancellationToken
    ) => Ok(await sender.Send(command with { ProjectId = projectId }, cancellationToken));

    /// <summary>Updates an email subscription.</summary>
    [HttpPut("emails/{id:guid}")]
    public async Task<ActionResult<EmailSubscriptionResponse>> UpdateEmail(
        Guid projectId,
        Guid id,
        UpdateEmailSubscriptionCommand command,
        CancellationToken cancellationToken
    )
    {
        if (id != command.Id)
        {
            return BadRequest();
        }

        return Ok(await sender.Send(command with { ProjectId = projectId }, cancellationToken));
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
            new DeleteEmailSubscriptionCommand { ProjectId = projectId, Id = id },
            cancellationToken
        );

        return NoContent();
    }
}
