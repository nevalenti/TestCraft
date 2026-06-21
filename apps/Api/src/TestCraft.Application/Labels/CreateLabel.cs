using FluentValidation;
using MediatR;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Security;
using TestCraft.Domain.Entities;

namespace TestCraft.Application.Labels;

public record LabelResponse
{
    public required Guid Id { get; init; }
    public required string Name { get; init; }
    public required string Color { get; init; }
    public required Guid ProjectId { get; init; }
}

public static class CreateLabel
{
    public sealed record Command : IRequest<LabelResponse>, IProjectScopedRequest
    {
        public Guid ProjectId { get; init; }
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
            var label = new Label
            {
                Name = request.Name,
                Color = request.Color,
                ProjectId = request.ProjectId,
            };

            context.Labels.Add(label);
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
