using FluentValidation;
using MediatR;
using TestCraft.Application.Common.Exceptions;
using TestCraft.Application.Common.Extensions;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Security;
using TestCraft.Application.Common.Validation;
using TestCraft.Domain.Entities;

namespace TestCraft.Application.Features.TestSections;

public static class CreateTestSection
{
    /// <summary>Creates a section in a suite, at the top level or under another section.</summary>
    public sealed record Command : IRequest<TestSectionResponse>, IProjectScopedRequest
    {
        [JsonIgnore]
        public ProjectId ProjectId { get; init; }

        [JsonIgnore]
        public TestSuiteId SuiteId { get; init; }

        /// <summary>The section's display name, unique among its siblings.</summary>
        public required string Name { get; init; }

        /// <summary>The section's description. Null leaves it empty.</summary>
        public string? Description { get; init; }

        /// <summary>ID of the parent section. Null creates the section at the top level of the suite.</summary>
        public TestSectionId? ParentId { get; init; }
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
        ) =>
            await context.ExecuteInTransactionAsync(
                async token =>
                {
                    await context.TestSuites.EnsureExistsAsync(
                        suite =>
                            suite.Id == request.SuiteId && suite.ProjectId == request.ProjectId,
                        token
                    );
                    await context.LockSuiteAsync(request.SuiteId, token);

                    var tree = await context.LoadSectionTreeAsync(request.SuiteId, token);
                    if (request.ParentId is { } parentId && tree.Find(parentId) is null)
                    {
                        throw new NotFoundException();
                    }

                    tree.EnsureCanAdd(request.ParentId);

                    var section = TestSection.Create(
                        request.SuiteId,
                        request.ParentId,
                        request.Name,
                        request.Description,
                        tree.NextPosition(request.ParentId)
                    );
                    context.TestSections.Add(section);

                    await context.SaveOrConflictAsync(
                        dbExceptionClassifier,
                        CatalogConflicts.SectionNameTaken(),
                        token
                    );

                    return await TestSectionResponse.LoadAsync(context, section.Id, token);
                },
                cancellationToken
            );
    }
}
