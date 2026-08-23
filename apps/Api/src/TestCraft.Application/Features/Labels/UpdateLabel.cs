using FluentValidation;

using MediatR;

using Microsoft.EntityFrameworkCore;

using TestCraft.Application.Common.Exceptions;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Security;

namespace TestCraft.Application.Features.Labels;

public static class UpdateLabel
{
    /// <summary>Updates a label's name and color.</summary>
    public sealed record Command : IRequest<LabelResponse>, IProjectScopedRequest
    {
        /// <summary>The project the label belongs to.</summary>
        [System.Text.Json.Serialization.JsonIgnore]
        public ProjectId ProjectId { get; init; }

        /// <summary>The label to update.</summary>
        [System.Text.Json.Serialization.JsonIgnore]
        public LabelId Id { get; init; }

        /// <summary>The label's new display name.</summary>
        public required string Name { get; init; }

        /// <summary>The label's new color, as a "#RRGGBB" hex string.</summary>
        public required string Color { get; init; }
    }

    public sealed class Validator : AbstractValidator<Command>
    {
        public Validator()
        {
            RuleFor(command => command.Name).NotEmpty().MaximumLength(50);
            RuleFor(command => command.Color)
                .NotEmpty()
                .MaximumLength(7)
                .Matches("^#[0-9A-Fa-f]{6}$");
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
                    label => label.Id == request.Id && label.ProjectId == request.ProjectId,
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
