using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using TestCraft.Application.Common.Extensions;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Security;
using TestCraft.Domain.Exceptions;

namespace TestCraft.Application.Features.TestCases;

public static class MoveTestCases
{
    /// <summary>Moves test cases into a section of the same suite, after the cases already there.</summary>
    public sealed record Command : IRequest, IProjectScopedRequest
    {
        [JsonIgnore]
        public ProjectId ProjectId { get; init; }

        [JsonIgnore]
        public TestSuiteId SuiteId { get; init; }

        /// <summary>IDs of the test cases to move, in the order they should end up.</summary>
        public required IReadOnlyList<TestCaseId> CaseIds { get; init; }

        /// <summary>ID of the destination section. Null moves the cases to the top level of the suite.</summary>
        public TestSectionId? SectionId { get; init; }
    }

    public sealed class Validator : AbstractValidator<Command>
    {
        public Validator()
        {
            RuleFor(command => command.CaseIds).NotEmpty();
            RuleFor(command => command.CaseIds)
                .Must(ids => ids.Distinct().Count() == ids.Count)
                .WithMessage("Duplicate test case IDs are not allowed")
                .When(command => command.CaseIds.Count > 0);
        }
    }

    public sealed class Handler(IApplicationDbContext context) : IRequestHandler<Command>
    {
        public async Task Handle(Command request, CancellationToken cancellationToken) =>
            await context.ExecuteInTransactionAsync(
                async token =>
                {
                    await context.TestSuites.EnsureExistsAsync(
                        suite =>
                            suite.Id == request.SuiteId && suite.ProjectId == request.ProjectId,
                        token
                    );
                    await context.LockSuiteAsync(request.SuiteId, token);
                    if (request.SectionId is { } sectionId)
                    {
                        await context.TestSections.EnsureExistsAsync(
                            section =>
                                section.Id == sectionId && section.SuiteId == request.SuiteId,
                            token
                        );
                    }

                    var cases = await context
                        .TestCases.Where(testCase =>
                            testCase.SuiteId == request.SuiteId
                            && request.CaseIds.Contains(testCase.Id)
                        )
                        .ToDictionaryAsync(testCase => testCase.Id, token);
                    if (cases.Count != request.CaseIds.Count)
                    {
                        throw new DomainException("One or more test cases not found in this suite")
                        {
                            ErrorCode = DomainErrorCodes.CasesNotFound,
                        };
                    }

                    var position = await context.NextCasePositionAsync(
                        request.SuiteId,
                        request.SectionId,
                        token
                    );
                    foreach (var id in request.CaseIds)
                    {
                        cases[id].MoveTo(request.SectionId, position++);
                    }

                    await context.SaveChangesAsync(token);

                    return true;
                },
                cancellationToken
            );
    }
}
