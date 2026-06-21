using MediatR;
using Microsoft.EntityFrameworkCore;
using TestCraft.Application.Common.Exceptions;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Security;

namespace TestCraft.Application.Labels;

public static class DeleteLabel
{
    public sealed record Command : IRequest, IProjectScopedRequest
    {
        public Guid ProjectId { get; init; }
        public required Guid Id { get; init; }
    }

    public sealed class Handler(IApplicationDbContext context) : IRequestHandler<Command>
    {
        public async Task Handle(Command request, CancellationToken cancellationToken)
        {
            var label =
                await context.Labels.FirstOrDefaultAsync(
                    l => l.Id == request.Id && l.ProjectId == request.ProjectId,
                    cancellationToken
                ) ?? throw new NotFoundException();

            context.Labels.Remove(label);
            await context.SaveChangesAsync(cancellationToken);
        }
    }
}
