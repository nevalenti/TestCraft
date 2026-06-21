using MediatR;
using Microsoft.EntityFrameworkCore;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Security;

namespace TestCraft.Application.Labels;

public static class RemoveTestCaseLabel
{
    public sealed record Command : IRequest, IProjectScopedRequest
    {
        public Guid ProjectId { get; init; }
        public required Guid TestCaseId { get; init; }
        public required Guid LabelId { get; init; }
    }

    public sealed class Handler(IApplicationDbContext context) : IRequestHandler<Command>
    {
        public async Task Handle(Command request, CancellationToken cancellationToken)
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
}
