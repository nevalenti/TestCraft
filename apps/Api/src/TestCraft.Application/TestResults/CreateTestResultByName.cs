using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using TestCraft.Application.Caching;
using TestCraft.Application.Common.Exceptions;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Security;
using TestCraft.Domain.Entities;
using TestCraft.Domain.Enums;

namespace TestCraft.Application.TestResults;

public static class CreateTestResultByName
{
    public sealed record Command : IRequest<TestResultResponse>, IProjectScopedRequest
    {
        public Guid ProjectId { get; init; }
        public Guid RunId { get; init; }
        public required string SuiteName { get; init; }
        public required string TestCaseName { get; init; }
        public required TestResultStatus Status { get; init; }
        public string? Notes { get; init; }
        public long? DurationMs { get; init; }
        public string? Source { get; init; }
        public required DateTimeOffset ExecutedAt { get; init; }
    }

    public sealed class Validator : AbstractValidator<Command>
    {
        public Validator()
        {
            RuleFor(x => x.SuiteName).NotEmpty().MaximumLength(500);
            RuleFor(x => x.TestCaseName).NotEmpty().MaximumLength(500);
            RuleFor(x => x.Status).IsInEnum();
            RuleFor(x => x.Notes).MaximumLength(5000);
        }
    }

    public sealed class Handler(
        IApplicationDbContext context,
        ICacheService cache,
        ICurrentUser currentUser,
        ITestRunNotifier notifier
    ) : IRequestHandler<Command, TestResultResponse>
    {
        public async Task<TestResultResponse> Handle(
            Command request,
            CancellationToken cancellationToken
        )
        {
            var run =
                await context.TestRuns.FirstOrDefaultAsync(
                    r => r.Id == request.RunId && r.ProjectId == request.ProjectId,
                    cancellationToken
                ) ?? throw new NotFoundException();

            run.EnsureCanAddResult();

            var suite = await context.TestSuites.FirstOrDefaultAsync(
                s => s.ProjectId == request.ProjectId && s.Name == request.SuiteName,
                cancellationToken
            );

            if (suite is null)
            {
                suite = new TestSuite
                {
                    ProjectId = request.ProjectId,
                    Name = request.SuiteName,
                    Source = request.Source,
                };
                context.TestSuites.Add(suite);
                await context.SaveChangesAsync(cancellationToken);
            }

            var testCase = await context.TestCases.FirstOrDefaultAsync(
                c => c.SuiteId == suite.Id && c.Name == request.TestCaseName,
                cancellationToken
            );

            if (testCase is null)
            {
                testCase = new TestCase { SuiteId = suite.Id, Name = request.TestCaseName };
                context.TestCases.Add(testCase);
                await context.SaveChangesAsync(cancellationToken);
            }

            var result = new TestResult
            {
                TestRunId = request.RunId,
                TestCaseId = testCase.Id,
                Status = request.Status,
                Notes = request.Notes,
                DurationMs = request.DurationMs,
                ExecutedAt = request.ExecutedAt,
                ExecutedById = currentUser.UserId,
            };

            context.TestResults.Add(result);
            await context.SaveChangesAsync(cancellationToken);

            var summary = await context
                .TestResults.Where(r => r.Id == result.Id)
                .Select(r => new TestResultResponse
                {
                    Id = r.Id,
                    TestRunId = r.TestRunId,
                    TestCaseId = r.TestCaseId,
                    SuiteId = r.TestCase!.SuiteId,
                    TestCaseName = r.TestCase.Name,
                    Status = r.Status,
                    Notes = r.Notes,
                    DurationMs = r.DurationMs,
                    DefectType = r.DefectType,
                    ExecutedAt = r.ExecutedAt,
                    ExecutedById = r.ExecutedById,
                    CreatedAt = r.CreatedAt,
                    UpdatedAt = r.UpdatedAt,
                })
                .FirstAsync(cancellationToken);

            await cache.RemoveAsync(CacheKeys.TestRunResponse(request.RunId), cancellationToken);
            await notifier.ResultAddedAsync(request.RunId, summary, cancellationToken);

            return summary;
        }
    }
}
