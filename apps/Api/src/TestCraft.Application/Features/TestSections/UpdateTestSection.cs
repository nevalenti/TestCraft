using FluentValidation;
using MediatR;
using TestCraft.Application.Common.Concurrency;
using TestCraft.Application.Common.Exceptions;
using TestCraft.Application.Common.Extensions;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Security;
using TestCraft.Application.Common.Validation;

namespace TestCraft.Application.Features.TestSections;

public static class UpdateTestSection
{
    /// <summary>Renames a section or changes its description. Use the move endpoint to change its parent.</summary>
    public sealed record Command : IRequest<TestSectionResponse>, IProjectScopedRequest
    {
        [JsonIgnore]
        public ProjectId ProjectId { get; init; }

        [JsonIgnore]
        public TestSuiteId SuiteId { get; init; }

        [JsonIgnore]
        public TestSectionId Id { get; init; }

        /// <summary>The section's new display name, unique among its siblings.</summary>
        public required string Name { get; init; }

        /// <summary>The section's new description. Null clears it.</summary>
        public string? Description { get; init; }

        [JsonIgnore]
        public int? ExpectedVersion { get; init; }
    }

    public sealed class Validator : AbstractValidator<Command>
    {
        public Validator()
        {
            RuleFor(command => command.Name).RequiredName();
            RuleFor(command => command.Description).MaximumLength(FieldLengths.Text);
        }
    }

    public sealed class Handler(
        IApplicationDbContext context,
        IDbExceptionClassifier dbExceptionClassifier
    ) : IRequestHandler<Command, TestSectionResponse>
    {
        public async Task<TestSectionResponse> Handle(
            Command request,
            CancellationToken cancellationToken
        )
        {
            var section = await context.TestSections.FirstOrNotFoundAsync(
                existing =>
                    existing.Id == request.Id
                    && existing.SuiteId == request.SuiteId
                    && existing.Suite!.ProjectId == request.ProjectId,
                cancellationToken
            );

            VersionCheck.Ensure(section, request.ExpectedVersion);
            section.Update(request.Name, request.Description);

            await context.SaveOrConflictAsync(
                dbExceptionClassifier,
                CatalogConflicts.SectionNameTaken(),
                cancellationToken
            );

            return await TestSectionResponse.LoadAsync(context, section.Id, cancellationToken);
        }
    }
}
