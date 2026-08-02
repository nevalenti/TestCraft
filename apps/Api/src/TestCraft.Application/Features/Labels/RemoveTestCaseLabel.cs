using MediatR;
using Microsoft.EntityFrameworkCore;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Security;

namespace TestCraft.Application.Features.Labels;

public static class RemoveTestCaseLabel
{
    /// <summary>Removes a label from a test case.</summary>
    public sealed record Command : IRequest, IProjectScopedRequest
    {
        /// <summary>The project the test case belongs to.</summary>
        public Guid ProjectId { get; init; }

        /// <summary>The test case to unlabel.</summary>
        public required Guid TestCaseId { get; init; }

        /// <summary>The label to remove.</summary>
        public required Guid LabelId { get; init; }
    }

    public sealed class Handler(IApplicationDbContext context) : IRequestHandler<Command>
    {
        public async Task Handle(Command request, CancellationToken cancellationToken)
        {
            var entry = await context.TestCaseLabels.FirstOrDefaultAsync(
                tcl =>
                    tcl.TestCaseId == request.TestCaseId
                    && tcl.LabelId == request.LabelId
                    && tcl.TestCase!.Suite!.ProjectId == request.ProjectId,
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
