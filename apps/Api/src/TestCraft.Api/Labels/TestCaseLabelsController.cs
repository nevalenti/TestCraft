using Asp.Versioning;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TestCraft.Application.Labels;

namespace TestCraft.Api.Labels;

[Authorize]
[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/projects/{projectId:guid}/cases/{caseId:guid}/labels")]
public class TestCaseLabelsController(ISender sender) : ControllerBase
{
    /// <summary>Assigns a label to a test case.</summary>
    [HttpPost("{labelId:guid}")]
    public async Task<IActionResult> Add(
        Guid projectId,
        Guid caseId,
        Guid labelId,
        CancellationToken cancellationToken
    )
    {
        await sender.Send(
            new AddTestCaseLabel.Command
            {
                ProjectId = projectId,
                TestCaseId = caseId,
                LabelId = labelId,
            },
            cancellationToken
        );

        return NoContent();
    }

    /// <summary>Removes a label from a test case.</summary>
    [HttpDelete("{labelId:guid}")]
    public async Task<IActionResult> Remove(
        Guid projectId,
        Guid caseId,
        Guid labelId,
        CancellationToken cancellationToken
    )
    {
        await sender.Send(
            new RemoveTestCaseLabel.Command
            {
                ProjectId = projectId,
                TestCaseId = caseId,
                LabelId = labelId,
            },
            cancellationToken
        );

        return NoContent();
    }
}
