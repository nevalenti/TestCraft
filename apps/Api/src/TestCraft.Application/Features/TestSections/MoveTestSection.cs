using FluentValidation;
using MediatR;
using TestCraft.Application.Common.Concurrency;
using TestCraft.Application.Common.Exceptions;
using TestCraft.Application.Common.Extensions;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Security;

namespace TestCraft.Application.Features.TestSections;

public static class MoveTestSection
{
    /// <summary>Moves a section, with its subsections and test cases, under another parent in the same suite.</summary>
    public sealed record Command : IRequest<TestSectionResponse>, IProjectScopedRequest
    {
        [JsonIgnore]
        public ProjectId ProjectId { get; init; }

        [JsonIgnore]
        public TestSuiteId SuiteId { get; init; }

        [JsonIgnore]
        public TestSectionId Id { get; init; }

        /// <summary>ID of the new parent section. Null moves the section to the top level of the suite.</summary>
        public TestSectionId? ParentId { get; init; }

        /// <summary>The section's place among its new siblings. Null puts it last.</summary>
        public int? Position { get; init; }

        [JsonIgnore]
        public int? ExpectedVersion { get; init; }
    }

    public sealed class Validator : AbstractValidator<Command>
    {
        public Validator()
        {
            RuleFor(command => command.Position)
                .GreaterThanOrEqualTo(1)
                .When(command => command.Position is not null);
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
                    var section = tree.Find(request.Id) ?? throw new NotFoundException();
                    if (request.ParentId is { } parentId && tree.Find(parentId) is null)
                    {
                        throw new NotFoundException();
                    }

                    VersionCheck.Ensure(section, request.ExpectedVersion);
                    tree.EnsureCanMove(section.Id, request.ParentId);
                    section.MoveTo(
                        request.ParentId,
                        request.Position ?? tree.NextPosition(request.ParentId)
                    );

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
