using MediatR;
using Microsoft.AspNetCore.Mvc;
using TestCraft.Api.Authorization;
using TestCraft.Api.Idempotency;
using TestCraft.Application.Features.Import;

namespace TestCraft.Api.Features.Import;

[ApiTokenScope("imports")]
[Route("api/v{version:apiVersion}/projects/{projectId:guid}/import")]
public class ImportController(ISender sender) : ApiControllerBase
{
    /// <summary>Gets the status of an import job.</summary>
    [HttpGet("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<ActionResult<ImportJobResponse>> GetById(
        ProjectId projectId,
        ImportJobId id,
        CancellationToken cancellationToken
    ) =>
        Ok(
            await sender.Send(
                new GetImportJobById.Query { ProjectId = projectId, Id = id },
                cancellationToken
            )
        );

    /// <summary>Queues an asynchronous import of JUnit XML test results.</summary>
    [HttpPost("junit")]
    [Idempotent]
    [RequestSizeLimit(5_000_000)]
    [ProducesResponseType(typeof(ImportJobResponse), StatusCodes.Status202Accepted)]
    public async Task<ActionResult<ImportJobResponse>> ImportJUnit(
        ProjectId projectId,
        ImportJUnit.Command command,
        CancellationToken cancellationToken
    )
    {
        var result = await sender.Send(command with { ProjectId = projectId }, cancellationToken);

        return AcceptedAtAction(nameof(GetById), new { projectId, id = result.Id }, result);
    }

    /// <summary>Queues an asynchronous import of Allure test results.</summary>
    [HttpPost("allure")]
    [Idempotent]
    [RequestSizeLimit(5_000_000)]
    [ProducesResponseType(typeof(ImportJobResponse), StatusCodes.Status202Accepted)]
    public async Task<ActionResult<ImportJobResponse>> ImportAllure(
        ProjectId projectId,
        ImportAllure.Command command,
        CancellationToken cancellationToken
    )
    {
        var result = await sender.Send(command with { ProjectId = projectId }, cancellationToken);

        return AcceptedAtAction(nameof(GetById), new { projectId, id = result.Id }, result);
    }
}
