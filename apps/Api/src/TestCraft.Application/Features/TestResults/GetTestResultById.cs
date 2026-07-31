using MediatR;
using Microsoft.EntityFrameworkCore;
using TestCraft.Application.Common.Exceptions;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Security;

namespace TestCraft.Application.Features.TestResults;

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
                .TestResults.Where(result =>
                    result.Id == request.Id && result.TestRunId == request.RunId
                )
                .Select(result => new TestResultResponse
                {
                    Id = result.Id,
                    TestRunId = result.TestRunId,
                    TestCaseId = result.TestCaseId,
                    SuiteId = result.TestCase!.SuiteId,
                    TestCaseName = result.TestCase.Name,
                    Status = result.Status,
                    Notes = result.Notes,
                    DurationMs = result.DurationMs,
                    DefectType = result.DefectType,
                    ExecutedAt = result.ExecutedAt,
                    ExecutedById = result.ExecutedById,
                    CreatedAt = result.CreatedAt,
                    UpdatedAt = result.UpdatedAt,
                })
                .FirstOrDefaultAsync(cancellationToken)
            ?? throw new NotFoundException();
    }
}
