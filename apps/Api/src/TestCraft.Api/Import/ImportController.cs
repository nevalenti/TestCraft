using Asp.Versioning;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TestCraft.Application.Import;

namespace TestCraft.Api.Import;

[Authorize]
[ApiController]
[ApiVersion("1.0")]
[RequestSizeLimit(5_000_000)]
[Route("api/v{version:apiVersion}/projects/{projectId:guid}/import")]
public class ImportController(ISender sender) : ControllerBase
{
    /// <summary>Gets the status of an import job.</summary>
    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ImportJobResponse>> GetById(
        Guid projectId,
        Guid id,
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
    public async Task<ActionResult<ImportJobResponse>> ImportJUnit(
        Guid projectId,
        ImportJUnit.Command command,
        CancellationToken cancellationToken
    )
    {
        var job = await sender.Send(command with { ProjectId = projectId }, cancellationToken);

        return AcceptedAtAction(nameof(GetById), new { projectId, id = job.Id }, job);
    }

    /// <summary>Queues an asynchronous import of Allure test results.</summary>
    [HttpPost("allure")]
    public async Task<ActionResult<ImportJobResponse>> ImportAllure(
        Guid projectId,
        ImportAllure.Command command,
        CancellationToken cancellationToken
    )
    {
        var job = await sender.Send(command with { ProjectId = projectId }, cancellationToken);

        return AcceptedAtAction(nameof(GetById), new { projectId, id = job.Id }, job);
    }
}
