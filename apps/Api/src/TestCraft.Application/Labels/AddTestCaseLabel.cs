using MediatR;
using Microsoft.EntityFrameworkCore;
using TestCraft.Application.Common.Exceptions;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Security;
using TestCraft.Domain.Entities;

namespace TestCraft.Application.Labels;

public static class AddTestCaseLabel
{
    /// <summary>Attaches a label to a test case.</summary>
    public sealed record Command : IRequest, IProjectScopedRequest
    {
        /// <summary>The project the test case belongs to.</summary>
        public Guid ProjectId { get; init; }

        /// <summary>The test case to label.</summary>
        public required Guid TestCaseId { get; init; }

        /// <summary>The label to attach.</summary>
        public required Guid LabelId { get; init; }
    }

    public sealed class Handler(IApplicationDbContext context) : IRequestHandler<Command>
    {
        public async Task Handle(Command request, CancellationToken cancellationToken)
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
}
