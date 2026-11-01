using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using TestCraft.Application.Common.Exceptions;
using TestCraft.Application.Common.Extensions;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Security;
using TestCraft.Application.Common.Validation;
using TestCraft.Application.Features.Labels;
using TestCraft.Domain.Entities;
using TestCraft.Domain.Enums;

namespace TestCraft.Application.Features.TestCases;

public static class CreateTestCase
{
    /// <summary>Creates a new test case in a suite.</summary>
    public sealed record Command : IRequest<TestCaseResponse>, IProjectScopedRequest
    {
        /// <summary>The project the suite belongs to.</summary>
        [JsonIgnore]
        public ProjectId ProjectId { get; init; }

        /// <summary>The suite to create the test case in.</summary>
        [JsonIgnore]
        public TestSuiteId SuiteId { get; init; }

        /// <summary>The test case's display name.</summary>
        public required string Name { get; init; }

        /// <summary>The test case's description.</summary>
        public string? Description { get; init; }

        /// <summary>The test case's priority. Defaults to Medium if omitted.</summary>
        public TestCasePriority? Priority { get; init; }
    }

    public sealed class Validator : AbstractValidator<Command>
    {
        public Validator()
        {
            RuleFor(command => command.Name).NotEmpty().MaximumLength(FieldLengths.Name);
            RuleFor(command => command.Description).MaximumLength(2000);
            RuleFor(command => command.Priority)
                .IsInEnum()
                .When(command => command.Priority is not null);
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
            var suiteExists = await context.TestSuites.AnyAsync(
                suite => suite.Id == request.SuiteId && suite.ProjectId == request.ProjectId,
                cancellationToken
            );
            if (!suiteExists)
            {
                throw new NotFoundException();
            }

            var testCase = TestCase.Create(
                request.SuiteId,
                request.Name,
                request.Description,
                request.Priority ?? TestCasePriority.Medium
            );

            context.TestCases.Add(testCase);

            await context.SaveOrConflictAsync(
                dbExceptionClassifier,
                CatalogConflicts.CaseNameTaken(),
                cancellationToken
            );

            return await context
                .TestCases.Where(created => created.Id == testCase.Id)
                .Select(TestCaseResponse.Projection)
                .FirstAsync(cancellationToken);
        }
    }
}
