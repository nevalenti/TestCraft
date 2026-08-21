using MediatR;
using Microsoft.EntityFrameworkCore;
using TestCraft.Application.Common.Exceptions;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Security;

namespace TestCraft.Application.Features.TestRuns;

public static class GetTestRunById
{
    /// <summary>Requests a single test run by id.</summary>
    public sealed record Query : IRequest<TestRunResponse>, IProjectScopedRequest
    {
        /// <summary>The project the run belongs to.</summary>
        public required ProjectId ProjectId { get; init; }

        /// <summary>The run to look up.</summary>
        public required TestRunId Id { get; init; }
    }

    public sealed class Handler(IApplicationDbContext context)
        : IRequestHandler<Query, TestRunResponse>
    {
        public async Task<TestRunResponse> Handle(
            Query request,
            CancellationToken cancellationToken
        ) =>
            await context
                .TestRuns.Where(run => run.Id == request.Id && run.ProjectId == request.ProjectId)
                .Select(run => new TestRunResponse
                {
                    Id = run.Id,
                    ProjectId = run.ProjectId,
                    Name = run.Name,
                    Environment = run.Environment,
                    Status = run.Status,
                    Source = run.Source,
                    ExecutedById = run.ExecutedById,
                    ExecutedByName = run.ExecutedByName,
                    CreatedAt = run.CreatedAt,
                    UpdatedAt = run.UpdatedAt,
                })
                .FirstOrDefaultAsync(cancellationToken)
            ?? throw new NotFoundException();
    }
}
