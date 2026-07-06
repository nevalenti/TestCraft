using FluentValidation;
using MediatR;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Security;
using TestCraft.Domain.Entities;

namespace TestCraft.Application.Labels;

/// <summary>A label that can be attached to test cases within a project.</summary>
public record LabelResponse
{
    /// <summary>The label's identifier.</summary>
    public required Guid Id { get; init; }

    /// <summary>The label's display name.</summary>
    public required string Name { get; init; }

    /// <summary>The label's color, as a "#RRGGBB" hex string.</summary>
    public required string Color { get; init; }

    /// <summary>The project the label belongs to.</summary>
    public required Guid ProjectId { get; init; }
}

public static class CreateLabel
{
    /// <summary>Creates a new label in a project.</summary>
    public sealed record Command : IRequest<LabelResponse>, IProjectScopedRequest
    {
        /// <summary>The project to create the label in.</summary>
        public Guid ProjectId { get; init; }

        /// <summary>The label's display name.</summary>
        public required string Name { get; init; }

        /// <summary>The label's color, as a "#RRGGBB" hex string.</summary>
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
