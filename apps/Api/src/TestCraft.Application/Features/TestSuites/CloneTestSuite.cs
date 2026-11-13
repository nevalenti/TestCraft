using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using TestCraft.Application.Common.Exceptions;
using TestCraft.Application.Common.Extensions;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Security;
using TestCraft.Application.Common.Validation;
using TestCraft.Domain.Entities;

namespace TestCraft.Application.Features.TestSuites;

public static class CloneTestSuite
{
    /// <summary>Copies a suite, with its test cases, steps and labels, into the same or another project.</summary>
    public sealed record Command : IRequest<TestSuiteResponse>, IProjectScopedRequest
    {
        [JsonIgnore]
        public ProjectId ProjectId { get; init; }

        /// <summary>The suite to copy.</summary>
        [JsonIgnore]
        public TestSuiteId Id { get; init; }

        /// <summary>The project to copy into. Null copies into the source project. The controller requires the editor role there.</summary>
        public ProjectId? TargetProjectId { get; init; }

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
    ) : IRequestHandler<Command, TestSuiteResponse>
    {
        public async Task<TestSuiteResponse> Handle(
            Command request,
            CancellationToken cancellationToken
        )
        {
            var targetProjectId = request.TargetProjectId ?? request.ProjectId;
            var source = await context.TestSuites.FirstOrNotFoundAsync(
                suite => suite.Id == request.Id && suite.ProjectId == request.ProjectId,
                cancellationToken
            );

            var name = request.Name;
            if (name is null)
            {
                var taken = await context
                    .TestSuites.Where(suite => suite.ProjectId == targetProjectId)
                    .Select(suite => suite.Name)
                    .ToListAsync(cancellationToken);
                name = CopyName.FirstFree(source.Name, taken.ToHashSet());
            }

            var copy = TestSuite.Create(targetProjectId, name, source.Description, source.Source);
            context.TestSuites.Add(copy);

            var cases = await context
                .TestCases.Include(testCase => testCase.Steps)
                .Include(testCase => testCase.TestCaseLabels)
                    .ThenInclude(link => link.Label)
                .Where(testCase => testCase.SuiteId == source.Id)
                .ToListAsync(cancellationToken);
            var labelIds = await MapLabelsAsync(
                cases,
                request.ProjectId,
                targetProjectId,
                cancellationToken
            );

            foreach (var testCase in cases)
            {
                var caseCopy = TestCase.Create(
                    copy.Id,
                    testCase.Name,
                    testCase.Description,
                    testCase.Priority
                );
                context.TestCases.Add(caseCopy);
                foreach (var step in testCase.Steps.OrderBy(step => step.Order))
                {
                    context.TestCaseSteps.Add(
                        TestCaseStep.Create(
                            caseCopy.Id,
                            step.Order,
                            step.Action,
                            step.ExpectedResult
                        )
                    );
                }

                foreach (var link in testCase.TestCaseLabels)
                {
                    context.TestCaseLabels.Add(
                        TestCaseLabel.Create(caseCopy.Id, labelIds[link.LabelId])
                    );
                }
            }

            await context.SaveOrConflictAsync(
                dbExceptionClassifier,
                CatalogConflicts.SuiteNameTaken(),
                cancellationToken
            );

            return TestSuiteResponse.FromEntity(copy);
        }

        private async Task<Dictionary<LabelId, LabelId>> MapLabelsAsync(
            List<TestCase> cases,
            ProjectId sourceProjectId,
            ProjectId targetProjectId,
            CancellationToken cancellationToken
        )
        {
            var used = cases
                .SelectMany(testCase => testCase.TestCaseLabels)
                .Select(link => link.Label!)
                .DistinctBy(label => label.Id)
                .ToList();
            if (targetProjectId == sourceProjectId)
            {
                return used.ToDictionary(label => label.Id, label => label.Id);
            }

            var names = used.Select(label => label.Name).ToList();
            var existing = await context
                .Labels.Where(label =>
                    label.ProjectId == targetProjectId && names.Contains(label.Name)
                )
                .ToDictionaryAsync(label => label.Name, cancellationToken);

            var map = new Dictionary<LabelId, LabelId>();
            foreach (var label in used)
            {
                if (!existing.TryGetValue(label.Name, out var match))
                {
                    match = new Label
                    {
                        Id = LabelId.New(),
                        Name = label.Name,
                        Color = label.Color,
                        ProjectId = targetProjectId,
                    };
                    context.Labels.Add(match);
                }

                map[label.Id] = match.Id;
            }

            return map;
        }
    }
}
