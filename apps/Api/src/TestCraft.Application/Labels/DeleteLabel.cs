using MediatR;
using Microsoft.EntityFrameworkCore;
using TestCraft.Application.Common.Exceptions;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Security;

namespace TestCraft.Application.Labels;

public static class DeleteLabel
{
    /// <summary>Deletes a label from a project.</summary>
    public sealed record Command : IRequest, IProjectScopedRequest
    {
        /// <summary>The project the label belongs to.</summary>
        public Guid ProjectId { get; init; }

        /// <summary>The label to delete.</summary>
        public required Guid Id { get; init; }
    }

    public sealed class Handler(IApplicationDbContext context) : IRequestHandler<Command>
    {
        public async Task Handle(Command request, CancellationToken cancellationToken)
        {
            var label =
                await context.Labels.FirstOrDefaultAsync(
                    label => label.Id == request.Id && label.ProjectId == request.ProjectId,
                    cancellationToken
                ) ?? throw new NotFoundException();

            context.Labels.Remove(label);
            await context.SaveChangesAsync(cancellationToken);
        }
    }
}
