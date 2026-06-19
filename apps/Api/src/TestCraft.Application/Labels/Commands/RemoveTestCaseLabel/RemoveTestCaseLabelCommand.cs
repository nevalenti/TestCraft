using MediatR;
using Microsoft.EntityFrameworkCore;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Security;

namespace TestCraft.Application.Labels.Commands.RemoveTestCaseLabel;

public record RemoveTestCaseLabelCommand : IRequest, IProjectScopedRequest
{
    public Guid ProjectId { get; init; }
    public required Guid TestCaseId { get; init; }
    public required Guid LabelId { get; init; }
}

public class RemoveTestCaseLabelCommandHandler(IApplicationDbContext context)
    : IRequestHandler<RemoveTestCaseLabelCommand>
{
    public async Task Handle(
        RemoveTestCaseLabelCommand request,
        CancellationToken cancellationToken
    )
    {
        var entry = await context.TestCaseLabels.FirstOrDefaultAsync(
            tcl => tcl.TestCaseId == request.TestCaseId && tcl.LabelId == request.LabelId,
            cancellationToken
        );

        if (entry is null)
        {
            return;
        }

        context.TestCaseLabels.Remove(entry);
        await context.SaveChangesAsync(cancellationToken);
    }
}
