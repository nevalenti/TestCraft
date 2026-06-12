using Asp.Versioning;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TestCraft.Application.Import;
using TestCraft.Application.Import.Commands.ImportAllure;
using TestCraft.Application.Import.Commands.ImportJUnit;
using TestCraft.Application.Import.Queries.GetImportJobById;

namespace TestCraft.Api.Import;

[Authorize]
[ApiController]
[ApiVersion("1.0")]
[RequestSizeLimit(5_000_000)]
[Route("api/v{version:apiVersion}/projects/{projectId:guid}/import")]
public class ImportController(ISender sender) : ControllerBase
{
    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ImportJobResponse>> GetById(
        Guid projectId,
        Guid id,
        CancellationToken cancellationToken
    ) =>
        Ok(
            await sender.Send(
                new GetImportJobByIdQuery { ProjectId = projectId, Id = id },
                cancellationToken
            )
        );

    [HttpPost("junit")]
    public async Task<ActionResult<ImportJobResponse>> ImportJUnit(
        Guid projectId,
        ImportJUnitCommand command,
        CancellationToken cancellationToken
    )
    {
        var job = await sender.Send(command with { ProjectId = projectId }, cancellationToken);

        return AcceptedAtAction(nameof(GetById), new { projectId, id = job.Id }, job);
    }

    [HttpPost("allure")]
    public async Task<ActionResult<ImportJobResponse>> ImportAllure(
        Guid projectId,
        ImportAllureCommand command,
        CancellationToken cancellationToken
    )
    {
        var job = await sender.Send(command with { ProjectId = projectId }, cancellationToken);

        return AcceptedAtAction(nameof(GetById), new { projectId, id = job.Id }, job);
    }
}
