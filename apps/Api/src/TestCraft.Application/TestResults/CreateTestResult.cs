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

public record TestResultResponse
{
    public required Guid Id { get; init; }
    public required Guid TestRunId { get; init; }
    public required Guid TestCaseId { get; init; }
    public required Guid SuiteId { get; init; }
    public required string TestCaseName { get; init; }
    public required TestResultStatus Status { get; init; }
    public string? Notes { get; init; }
    public long? DurationMs { get; init; }
    public DefectType? DefectType { get; init; }
    public required DateTimeOffset ExecutedAt { get; init; }
    public Guid? ExecutedById { get; init; }
    public required DateTimeOffset CreatedAt { get; init; }
    public required DateTimeOffset UpdatedAt { get; init; }
}

public static class CreateTestResult
{
    public sealed record Command : IRequest<TestResultResponse>, IProjectScopedRequest
    {
        public Guid ProjectId { get; init; }
        public Guid RunId { get; init; }
        public required Guid TestCaseId { get; init; }
        public required TestResultStatus Status { get; init; }
        public string? Notes { get; init; }
        public long? DurationMs { get; init; }
        public DefectType? DefectType { get; init; }
        public required DateTimeOffset ExecutedAt { get; init; }
    }

    public sealed class Validator : AbstractValidator<Command>
    {
        public Validator()
        {
            RuleFor(x => x.TestCaseId).NotEmpty();
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

            var result = new TestResult
            {
                TestRunId = request.RunId,
                TestCaseId = request.TestCaseId,
                Status = request.Status,
                Notes = request.Notes,
                DurationMs = request.DurationMs,
                DefectType = request.DefectType,
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
