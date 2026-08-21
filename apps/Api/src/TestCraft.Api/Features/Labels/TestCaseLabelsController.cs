using Asp.Versioning;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TestCraft.Application.Features.Labels;

namespace TestCraft.Api.Features.Labels;

[Authorize]
[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/projects/{projectId:guid}/cases/{caseId:guid}/labels")]
public class TestCaseLabelsController(ISender sender) : ControllerBase
{
    /// <summary>Assigns a label to a test case.</summary>
    [HttpPost("{labelId:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> Add(
        ProjectId projectId,
        TestCaseId caseId,
        LabelId labelId,
        CancellationToken cancellationToken
    )
    {
        var command = new AddTestCaseLabel.Command
        {
            ProjectId = projectId,
            TestCaseId = caseId,
            LabelId = labelId,
        };
        await sender.Send(command, cancellationToken);

        return NoContent();
    }

    /// <summary>Removes a label from a test case.</summary>
    [HttpDelete("{labelId:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> Remove(
        ProjectId projectId,
        TestCaseId caseId,
        LabelId labelId,
        CancellationToken cancellationToken
    )
    {
        var command = new RemoveTestCaseLabel.Command
        {
            ProjectId = projectId,
            TestCaseId = caseId,
            LabelId = labelId,
        };
        await sender.Send(command, cancellationToken);

        return NoContent();
    }
}
