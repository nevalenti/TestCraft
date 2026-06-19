using MediatR;
using Microsoft.EntityFrameworkCore;
using TestCraft.Application.Common.Exceptions;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Security;

namespace TestCraft.Application.Labels.Commands.DeleteLabel;

public record DeleteLabelCommand : IRequest, IProjectScopedRequest
{
    public Guid ProjectId { get; init; }
    public required Guid Id { get; init; }
}

public class DeleteLabelCommandHandler(IApplicationDbContext context)
    : IRequestHandler<DeleteLabelCommand>
{
    public async Task Handle(DeleteLabelCommand request, CancellationToken cancellationToken)
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
