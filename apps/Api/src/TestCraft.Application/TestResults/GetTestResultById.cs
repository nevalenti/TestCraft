using MediatR;
using Microsoft.EntityFrameworkCore;
using TestCraft.Application.Common.Exceptions;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Security;

namespace TestCraft.Application.TestResults;

public static class GetTestResultById
{
    /// <summary>Requests a single test result by id.</summary>
    public sealed record Query : IRequest<TestResultResponse>, IProjectScopedRequest
    {
        /// <summary>The project the run belongs to.</summary>
        public required Guid ProjectId { get; init; }

        /// <summary>The run the result belongs to.</summary>
        public required Guid RunId { get; init; }

        /// <summary>The result to look up.</summary>
        public required Guid Id { get; init; }
    }

    public sealed class Handler(IApplicationDbContext context)
        : IRequestHandler<Query, TestResultResponse>
    {
        public async Task<TestResultResponse> Handle(
            Query request,
            CancellationToken cancellationToken
        ) =>
            await context
                .TestResults.Where(r => r.Id == request.Id && r.TestRunId == request.RunId)
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
                .FirstOrDefaultAsync(cancellationToken)
            ?? throw new NotFoundException();
    }
}
