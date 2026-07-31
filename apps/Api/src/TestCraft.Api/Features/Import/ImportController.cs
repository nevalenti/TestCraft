using Asp.Versioning;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TestCraft.Application.Features.Import;

namespace TestCraft.Api.Features.Import;

[Authorize]
[ApiController]
[ApiVersion("1.0")]
[RequestSizeLimit(5_000_000)]
[Route("api/v{version:apiVersion}/projects/{projectId:guid}/import")]
public class ImportController(ISender sender) : ControllerBase
{
    /// <summary>Gets the status of an import job.</summary>
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(ImportJobResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<ImportJobResponse>> GetById(
        Guid projectId,
        Guid id,
        CancellationToken cancellationToken
    )
    {
        var query = new GetImportJobById.Query { ProjectId = projectId, Id = id };
        var result = await sender.Send(query, cancellationToken);

        return Ok(result);
    }

    /// <summary>Queues an asynchronous import of JUnit XML test results.</summary>
    [HttpPost("junit")]
    [ProducesResponseType(typeof(ImportJobResponse), StatusCodes.Status202Accepted)]
    public async Task<ActionResult<ImportJobResponse>> ImportJUnit(
        Guid projectId,
        ImportJUnit.Command command,
        CancellationToken cancellationToken
    )
    {
        var scopedCommand = command with { ProjectId = projectId };
        var result = await sender.Send(scopedCommand, cancellationToken);

        return AcceptedAtAction(nameof(GetById), new { projectId, id = result.Id }, result);
    }

    /// <summary>Queues an asynchronous import of Allure test results.</summary>
    [HttpPost("allure")]
    [ProducesResponseType(typeof(ImportJobResponse), StatusCodes.Status202Accepted)]
    public async Task<ActionResult<ImportJobResponse>> ImportAllure(
        Guid projectId,
        ImportAllure.Command command,
        CancellationToken cancellationToken
    )
    {
        var scopedCommand = command with { ProjectId = projectId };
        var result = await sender.Send(scopedCommand, cancellationToken);

        return AcceptedAtAction(nameof(GetById), new { projectId, id = result.Id }, result);
    }
}
