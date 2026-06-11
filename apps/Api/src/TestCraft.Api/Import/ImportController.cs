using Asp.Versioning;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TestCraft.Application.Import.Commands.ImportAllure;
using TestCraft.Application.Import.Commands.ImportJUnit;
using TestCraft.Application.TestRuns;

namespace TestCraft.Api.Import;

[Authorize]
[ApiController]
[ApiVersion("1.0")]
[RequestSizeLimit(5_000_000)]
[Route("api/v{version:apiVersion}/projects/{projectId:guid}/import")]
public class ImportController(ISender sender) : ControllerBase
{
    [HttpPost("junit")]
    public async Task<ActionResult<TestRunResponse>> ImportJUnit(
        Guid projectId,
        ImportJUnitRequest request,
        CancellationToken cancellationToken
    )
    {
        var run = await sender.Send(
            new ImportJUnitCommand
            {
                ProjectId = projectId,
                Xml = request.Xml,
                Environment = request.Environment,
                Name = request.Name,
                Source = request.Source,
            },
            cancellationToken
        );

        return StatusCode(StatusCodes.Status201Created, run);
    }

    [HttpPost("allure")]
    public async Task<ActionResult<TestRunResponse>> ImportAllure(
        Guid projectId,
        ImportAllureRequest request,
        CancellationToken cancellationToken
    )
    {
        var run = await sender.Send(
            new ImportAllureCommand
            {
                ProjectId = projectId,
                Results = request.Results,
                Environment = request.Environment,
                Name = request.Name,
                Source = request.Source,
            },
            cancellationToken
        );

        return StatusCode(StatusCodes.Status201Created, run);
    }
}
