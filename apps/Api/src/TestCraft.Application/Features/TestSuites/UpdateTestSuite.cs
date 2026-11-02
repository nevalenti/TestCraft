using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using TestCraft.Application.Common.Concurrency;
using TestCraft.Application.Common.Exceptions;
using TestCraft.Application.Common.Extensions;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Security;
using TestCraft.Application.Common.Validation;
using TestCraft.Application.Features.TestPlans;

namespace TestCraft.Application.Features.TestSuites;

public static class UpdateTestSuite
{
    /// <summary>Updates a test suite's name and description.</summary>
    public sealed record Command : IRequest<TestSuiteResponse>, IProjectScopedRequest
    {
        /// <summary>The project the suite belongs to.</summary>
        [JsonIgnore]
        public ProjectId ProjectId { get; init; }

        /// <summary>The suite to update.</summary>
        [JsonIgnore]
        public TestSuiteId Id { get; init; }

        /// <summary>The suite's new display name.</summary>
        public required string Name { get; init; }

        /// <summary>The suite's new description.</summary>
        public string? Description { get; init; }

        [JsonIgnore]
        public int? ExpectedVersion { get; init; }
    }

    public sealed class Validator : AbstractValidator<Command>
    {
        public Validator()
        {
            RuleFor(command => command.Name).NotEmpty().MaximumLength(FieldLengths.Name);
            RuleFor(command => command.Description).MaximumLength(2000);
        }
    }

    public sealed class Handler(
        IApplicationDbContext context,
        IDbExceptionClassifier dbExceptionClassifier,
        TimeProvider timeProvider
    ) : IRequestHandler<Command, TestSuiteResponse>
    {
        public async Task<TestSuiteResponse> Handle(
            Command request,
            CancellationToken cancellationToken
        )
        {
            var suite =
                await context.TestSuites.FirstOrDefaultAsync(
                    existingSuite =>
                        existingSuite.Id == request.Id
                        && existingSuite.ProjectId == request.ProjectId,
                    cancellationToken
                ) ?? throw new NotFoundException();

            VersionCheck.Ensure(suite, request.ExpectedVersion);
            var renamed = suite.Name != request.Name;
            suite.Update(request.Name, request.Description);

            await context.SaveOrConflictAsync(
                dbExceptionClassifier,
                CatalogConflicts.SuiteNameTaken(),
                cancellationToken
            );
            if (renamed)
            {
                await context.TouchPlansForSuiteAsync(
                    suite.Id,
                    timeProvider.GetStoredUtcNow(),
                    cancellationToken
                );
            }

            return TestSuiteResponse.FromEntity(suite);
        }
    }
}
