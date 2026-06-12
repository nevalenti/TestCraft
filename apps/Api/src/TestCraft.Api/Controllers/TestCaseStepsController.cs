using Asp.Versioning;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TestCraft.Api.Common;
using TestCraft.Api.Requests;
using TestCraft.Application.Commands;
using TestCraft.Application.Queries;
using TestCraft.Application.Responses;
using TestCraft.Domain.Pagination;

namespace TestCraft.Api.Controllers;

[Authorize]
[ApiController]
[ApiVersion("1.0")]
[Route(
    "api/v{version:apiVersion}/projects/{projectId:guid}/suites/{suiteId:guid}/cases/{caseId:guid}/steps"
)]
public class TestCaseStepsController(ISender sender) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<Paginated<TestCaseStepResponse>>> GetAll(
        Guid projectId,
        Guid suiteId,
        Guid caseId,
        [FromQuery] PaginationQuery query,
        CancellationToken cancellationToken
    ) =>
        Ok(
            await sender.Send(
                new GetTestCaseStepsQuery
                {
                    ProjectId = projectId,
                    CaseId = caseId,
                    Pagination = query.ToPaginationParams(),
                },
                cancellationToken
            )
        );

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<TestCaseStepResponse>> GetById(
        Guid projectId,
        Guid suiteId,
        Guid caseId,
        Guid id,
        CancellationToken cancellationToken
    ) =>
        Ok(
            await sender.Send(
                new GetTestCaseStepByIdQuery
                {
                    ProjectId = projectId,
                    CaseId = caseId,
                    Id = id,
                },
                cancellationToken
            )
        );

    [HttpPost]
    public async Task<ActionResult<TestCaseStepResponse>> Create(
        Guid projectId,
        Guid suiteId,
        Guid caseId,
        CreateTestCaseStepRequest request,
        CancellationToken cancellationToken
    )
    {
        var step = await sender.Send(
            new CreateTestCaseStepCommand
            {
                ProjectId = projectId,
                CaseId = caseId,
                Order = request.Order,
                Action = request.Action,
                ExpectedResult = request.ExpectedResult,
            },
            cancellationToken
        );

        return CreatedAtAction(
            nameof(GetById),
            new
            {
                projectId,
                suiteId,
                caseId,
                id = step.Id,
            },
            step
        );
    }

    [HttpPut("reorder")]
    public async Task<IActionResult> BulkReorder(
        Guid projectId,
        Guid suiteId,
        Guid caseId,
        BulkReorderStepsRequest request,
        CancellationToken cancellationToken
    )
    {
        await sender.Send(
            new BulkReorderStepsCommand
            {
                ProjectId = projectId,
                CaseId = caseId,
                Steps = request
                    .Steps.Select(s => new Application.Commands.ReorderStepInput
                    {
                        Id = s.Id,
                        Order = s.Order,
                    })
                    .ToList(),
            },
            cancellationToken
        );

        return NoContent();
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<TestCaseStepResponse>> Update(
        Guid projectId,
        Guid suiteId,
        Guid caseId,
        Guid id,
        UpdateTestCaseStepRequest request,
        CancellationToken cancellationToken
    ) =>
        Ok(
            await sender.Send(
                new UpdateTestCaseStepCommand
                {
                    ProjectId = projectId,
                    CaseId = caseId,
                    Id = id,
                    Order = request.Order,
                    Action = request.Action,
                    ExpectedResult = request.ExpectedResult,
                },
                cancellationToken
            )
        );

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(
        Guid projectId,
        Guid suiteId,
        Guid caseId,
        Guid id,
        CancellationToken cancellationToken
    )
    {
        await sender.Send(
            new DeleteTestCaseStepCommand
            {
                ProjectId = projectId,
                CaseId = caseId,
                Id = id,
            },
            cancellationToken
        );

        return NoContent();
    }
}
