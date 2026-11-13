using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using TestCraft.Application.Common.Exceptions;
using TestCraft.Application.Common.Extensions;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Security;
using TestCraft.Application.Common.Validation;
using TestCraft.Domain.Entities;

namespace TestCraft.Application.Features.TestCases;

public static class CloneTestCase
{
    /// <summary>Copies a test case, with its steps and labels, into the same or another suite of the project.</summary>
    public sealed record Command : IRequest<TestCaseResponse>, IProjectScopedRequest
    {
        [JsonIgnore]
        public ProjectId ProjectId { get; init; }

        [JsonIgnore]
        public TestSuiteId SuiteId { get; init; }

        [JsonIgnore]
        public TestCaseId Id { get; init; }

        /// <summary>The suite to copy into. Null copies into the source suite.</summary>
        public TestSuiteId? TargetSuiteId { get; init; }

        /// <summary>The copy's name. Null keeps the source name, adding "(copy)" if it is taken.</summary>
        public string? Name { get; init; }
    }

    public sealed class Validator : AbstractValidator<Command>
    {
        public Validator()
        {
            RuleFor(command => command.Name).MaximumLength(FieldLengths.Name);
        }
    }

    public sealed class Handler(
        IApplicationDbContext context,
        IDbExceptionClassifier dbExceptionClassifier
    ) : IRequestHandler<Command, TestCaseResponse>
    {
        public async Task<TestCaseResponse> Handle(
            Command request,
            CancellationToken cancellationToken
        )
        {
            var source = await context
                .TestCases.Include(testCase => testCase.Steps)
                .Include(testCase => testCase.TestCaseLabels)
                .FirstOrNotFoundAsync(
                    testCase =>
                        testCase.Id == request.Id
                        && testCase.SuiteId == request.SuiteId
                        && testCase.Suite!.ProjectId == request.ProjectId,
                    cancellationToken
                );

            var targetSuiteId = request.TargetSuiteId ?? source.SuiteId;
            await context.TestSuites.EnsureExistsAsync(
                suite => suite.Id == targetSuiteId && suite.ProjectId == request.ProjectId,
                cancellationToken
            );

            var name = request.Name;
            if (name is null)
            {
                var taken = await context
                    .TestCases.Where(testCase => testCase.SuiteId == targetSuiteId)
                    .Select(testCase => testCase.Name)
                    .ToListAsync(cancellationToken);
                name = CopyName.FirstFree(source.Name, taken.ToHashSet());
            }

            var copy = TestCase.Create(targetSuiteId, name, source.Description, source.Priority);
            context.TestCases.Add(copy);
            foreach (var step in source.Steps.OrderBy(step => step.Order))
            {
                context.TestCaseSteps.Add(
                    TestCaseStep.Create(copy.Id, step.Order, step.Action, step.ExpectedResult)
                );
            }

            foreach (var link in source.TestCaseLabels)
            {
                context.TestCaseLabels.Add(TestCaseLabel.Create(copy.Id, link.LabelId));
            }

            await context.SaveOrConflictAsync(
                dbExceptionClassifier,
                CatalogConflicts.CaseNameTaken(),
                cancellationToken
            );

            return await TestCaseResponse.LoadAsync(context, copy.Id, cancellationToken);
        }
    }
}
