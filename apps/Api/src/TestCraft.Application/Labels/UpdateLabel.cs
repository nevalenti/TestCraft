using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using TestCraft.Application.Common.Exceptions;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Security;

namespace TestCraft.Application.Labels;

public static class UpdateLabel
{
    public sealed record Command : IRequest<LabelResponse>, IProjectScopedRequest
    {
        public Guid ProjectId { get; init; }
        public required Guid Id { get; init; }
        public required string Name { get; init; }
        public required string Color { get; init; }
    }

    public sealed class Validator : AbstractValidator<Command>
    {
        public Validator()
        {
            RuleFor(x => x.Name).NotEmpty().MaximumLength(50);
            RuleFor(x => x.Color).NotEmpty().MaximumLength(7).Matches("^#[0-9A-Fa-f]{6}$");
        }
    }

    public sealed class Handler(IApplicationDbContext context)
        : IRequestHandler<Command, LabelResponse>
    {
        public async Task<LabelResponse> Handle(
            Command request,
            CancellationToken cancellationToken
        )
        {
            var label =
                await context.Labels.FirstOrDefaultAsync(
                    l => l.Id == request.Id && l.ProjectId == request.ProjectId,
                    cancellationToken
                ) ?? throw new NotFoundException();

            label.Name = request.Name;
            label.Color = request.Color;

            await context.SaveChangesAsync(cancellationToken);

            return new LabelResponse
            {
                Id = label.Id,
                Name = label.Name,
                Color = label.Color,
                ProjectId = label.ProjectId,
            };
        }
    }
}
