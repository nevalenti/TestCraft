using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using TestCraft.Application.Common.Extensions;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Security;
using TestCraft.Domain.Exceptions;

namespace TestCraft.Application.Features.TestSections;

public static class ReorderTestSections
{
    /// <summary>The new position for one section.</summary>
    public sealed record SectionOrder
    {
        /// <summary>ID of the section to reposition.</summary>
        public required TestSectionId Id { get; init; }

        /// <summary>The section's new place among its siblings, lowest first.</summary>
        public required int Position { get; init; }
    }

    /// <summary>Sets the position of several sections of a suite in one request.</summary>
    public sealed record Command : IRequest, IProjectScopedRequest
    {
        [JsonIgnore]
        public ProjectId ProjectId { get; init; }

        [JsonIgnore]
        public TestSuiteId SuiteId { get; init; }

        /// <summary>The sections to reposition. Sections not listed keep their position.</summary>
        public required IReadOnlyList<SectionOrder> Sections { get; init; }
    }

    public sealed class SectionOrderValidator : AbstractValidator<SectionOrder>
    {
        public SectionOrderValidator()
        {
            RuleFor(order => order.Position).GreaterThanOrEqualTo(1);
        }
    }

    public sealed class Validator : AbstractValidator<Command>
    {
        public Validator()
        {
            RuleFor(command => command.Sections).NotEmpty();
            RuleForEach(command => command.Sections).SetValidator(new SectionOrderValidator());
            RuleFor(command => command.Sections)
                .Must(sections =>
                    sections.Select(order => order.Id).Distinct().Count() == sections.Count
                )
                .WithMessage("Duplicate section IDs are not allowed")
                .When(command => command.Sections.Count > 0);
        }
    }

    public sealed class Handler(IApplicationDbContext context) : IRequestHandler<Command>
    {
        public async Task Handle(Command request, CancellationToken cancellationToken)
        {
            await context.TestSuites.EnsureExistsAsync(
                suite => suite.Id == request.SuiteId && suite.ProjectId == request.ProjectId,
                cancellationToken
            );

            var positions = request.Sections.ToDictionary(
                order => order.Id,
                order => order.Position
            );
            var ids = positions.Keys.ToList();
            var sections = await context
                .TestSections.Where(section =>
                    section.SuiteId == request.SuiteId && ids.Contains(section.Id)
                )
                .ToListAsync(cancellationToken);

            if (sections.Count != ids.Count)
            {
                throw new DomainException("One or more sections not found")
                {
                    ErrorCode = DomainErrorCodes.SectionsNotFound,
                };
            }

            foreach (var section in sections)
            {
                section.Reorder(positions[section.Id]);
            }

            await context.SaveChangesAsync(cancellationToken);
        }
    }
}
