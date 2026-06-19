using MediatR;
using Microsoft.EntityFrameworkCore;
using TestCraft.Application.Common.Exceptions;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Security;
using TestCraft.Domain.Entities;

namespace TestCraft.Application.Labels.Commands.AddTestCaseLabel;

public record AddTestCaseLabelCommand : IRequest, IProjectScopedRequest
{
    public Guid ProjectId { get; init; }
    public required Guid TestCaseId { get; init; }
    public required Guid LabelId { get; init; }
}

public class AddTestCaseLabelCommandHandler(IApplicationDbContext context)
    : IRequestHandler<AddTestCaseLabelCommand>
{
    public async Task Handle(AddTestCaseLabelCommand request, CancellationToken cancellationToken)
    {
        var caseExists = await context.TestCases.AnyAsync(
            tc => tc.Id == request.TestCaseId && tc.Suite!.ProjectId == request.ProjectId,
            cancellationToken
        );
        if (!caseExists)
        {
            throw new NotFoundException();
        }

        var labelExists = await context.Labels.AnyAsync(
            l => l.Id == request.LabelId && l.ProjectId == request.ProjectId,
            cancellationToken
        );
        if (!labelExists)
        {
            throw new NotFoundException();
        }

        var alreadyAssigned = await context.TestCaseLabels.AnyAsync(
            tcl => tcl.TestCaseId == request.TestCaseId && tcl.LabelId == request.LabelId,
            cancellationToken
        );
        if (alreadyAssigned)
        {
            return;
        }

        context.TestCaseLabels.Add(
            new TestCaseLabel { TestCaseId = request.TestCaseId, LabelId = request.LabelId }
        );
        await context.SaveChangesAsync(cancellationToken);
    }
}
