using MediatR;
using Microsoft.EntityFrameworkCore;
using TestCraft.Application.Common.Extensions;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Security;

namespace TestCraft.Application.Features.Labels;

public static class DeleteLabel
{
    public sealed record Command : IRequest, IProjectScopedRequest
    {
        /// <summary>The project the label belongs to.</summary>
        [JsonIgnore]
        public ProjectId ProjectId { get; init; }

        public required LabelId Id { get; init; }
    }

    public sealed class Handler(IApplicationDbContext context) : IRequestHandler<Command>
    {
        public async Task Handle(Command request, CancellationToken cancellationToken)
        {
            var label = await context.Labels.FirstOrNotFoundAsync(
                label => label.Id == request.Id && label.ProjectId == request.ProjectId,
                cancellationToken
            );

            context.Labels.Remove(label);

            await context.SaveChangesAsync(cancellationToken);
        }
    }
}
