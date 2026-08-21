using Asp.Versioning;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TestCraft.Application.Features.Notifications;

namespace TestCraft.Api.Features.Notifications;

[Authorize]
[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/projects/{projectId:guid}/notifications")]
public class NotificationsController(ISender sender) : ControllerBase
{
    /// <summary>Lists webhook subscriptions for a project.</summary>
    [HttpGet("webhooks")]
    [ProducesResponseType(
        typeof(IReadOnlyList<WebhookSubscriptionResponse>),
        StatusCodes.Status200OK
    )]
    public async Task<ActionResult<IReadOnlyList<WebhookSubscriptionResponse>>> GetWebhooks(
        ProjectId projectId,
        CancellationToken cancellationToken
    )
    {
        var query = new GetWebhookSubscriptions.Query { ProjectId = projectId };
        var result = await sender.Send(query, cancellationToken);

        return Ok(result);
    }

    /// <summary>Creates a webhook subscription.</summary>
    [HttpPost("webhooks")]
    [ProducesResponseType(typeof(WebhookSubscriptionResponse), StatusCodes.Status201Created)]
    public async Task<ActionResult<WebhookSubscriptionResponse>> CreateWebhook(
        ProjectId projectId,
        CreateWebhookSubscription.Command command,
        CancellationToken cancellationToken
    )
    {
        var scopedCommand = command with { ProjectId = projectId };
        var result = await sender.Send(scopedCommand, cancellationToken);

        return StatusCode(StatusCodes.Status201Created, result);
    }

    /// <summary>Updates a webhook subscription.</summary>
    [HttpPut("webhooks/{id:guid}")]
    [ProducesResponseType(typeof(WebhookSubscriptionResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<WebhookSubscriptionResponse>> UpdateWebhook(
        ProjectId projectId,
        WebhookSubscriptionId id,
        UpdateWebhookSubscription.Command command,
        CancellationToken cancellationToken
    )
    {
        var scopedCommand = command with { ProjectId = projectId, Id = id };
        var result = await sender.Send(scopedCommand, cancellationToken);

        return Ok(result);
    }

    /// <summary>Deletes a webhook subscription.</summary>
    [HttpDelete("webhooks/{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> DeleteWebhook(
        ProjectId projectId,
        WebhookSubscriptionId id,
        CancellationToken cancellationToken
    )
    {
        var command = new DeleteWebhookSubscription.Command { ProjectId = projectId, Id = id };
        await sender.Send(command, cancellationToken);

        return NoContent();
    }

    /// <summary>Lists email subscriptions for a project.</summary>
    [HttpGet("emails")]
    [ProducesResponseType(
        typeof(IReadOnlyList<EmailSubscriptionResponse>),
        StatusCodes.Status200OK
    )]
    public async Task<ActionResult<IReadOnlyList<EmailSubscriptionResponse>>> GetEmails(
        ProjectId projectId,
        CancellationToken cancellationToken
    )
    {
        var query = new GetEmailSubscriptions.Query { ProjectId = projectId };
        var result = await sender.Send(query, cancellationToken);

        return Ok(result);
    }

    /// <summary>Creates an email subscription.</summary>
    [HttpPost("emails")]
    [ProducesResponseType(typeof(EmailSubscriptionResponse), StatusCodes.Status201Created)]
    public async Task<ActionResult<EmailSubscriptionResponse>> CreateEmail(
        ProjectId projectId,
        CreateEmailSubscription.Command command,
        CancellationToken cancellationToken
    )
    {
        var scopedCommand = command with { ProjectId = projectId };
        var result = await sender.Send(scopedCommand, cancellationToken);

        return StatusCode(StatusCodes.Status201Created, result);
    }

    /// <summary>Updates an email subscription.</summary>
    [HttpPut("emails/{id:guid}")]
    [ProducesResponseType(typeof(EmailSubscriptionResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<EmailSubscriptionResponse>> UpdateEmail(
        ProjectId projectId,
        EmailSubscriptionId id,
        UpdateEmailSubscription.Command command,
        CancellationToken cancellationToken
    )
    {
        var scopedCommand = command with { ProjectId = projectId, Id = id };
        var result = await sender.Send(scopedCommand, cancellationToken);

        return Ok(result);
    }

    /// <summary>Deletes an email subscription.</summary>
    [HttpDelete("emails/{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> DeleteEmail(
        ProjectId projectId,
        EmailSubscriptionId id,
        CancellationToken cancellationToken
    )
    {
        var command = new DeleteEmailSubscription.Command { ProjectId = projectId, Id = id };
        await sender.Send(command, cancellationToken);

        return NoContent();
    }
}
