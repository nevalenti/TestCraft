using MediatR;
using Microsoft.EntityFrameworkCore;
using TestCraft.Application.Common.Extensions;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Security;
using TestCraft.Domain.Entities;

namespace TestCraft.Application.Features.Labels;

public static class AddTestCaseLabel
{
    public sealed record Command : IRequest, IProjectScopedRequest
    {
        [JsonIgnore]
        public ProjectId ProjectId { get; init; }

        public required TestCaseId TestCaseId { get; init; }

        public required LabelId LabelId { get; init; }
    }

    public sealed class Handler(IApplicationDbContext context) : IRequestHandler<Command>
    {
        public async Task Handle(Command request, CancellationToken cancellationToken)
        {
            await context.TestCases.EnsureExistsAsync(
                tc => tc.Id == request.TestCaseId && tc.Suite!.ProjectId == request.ProjectId,
                cancellationToken
            );

            await context.Labels.EnsureExistsAsync(
                label => label.Id == request.LabelId && label.ProjectId == request.ProjectId,
                cancellationToken
            );

            var alreadyAssigned = await context.TestCaseLabels.AnyAsync(
                tcl => tcl.TestCaseId == request.TestCaseId && tcl.LabelId == request.LabelId,
                cancellationToken
            );
            if (alreadyAssigned)
            {
                return;
            }

            context.TestCaseLabels.Add(TestCaseLabel.Create(request.TestCaseId, request.LabelId));

            await context.SaveChangesAsync(cancellationToken);
        }
    }
}
