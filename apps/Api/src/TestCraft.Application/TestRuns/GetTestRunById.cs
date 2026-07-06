using MediatR;
using Microsoft.EntityFrameworkCore;
using TestCraft.Application.Common.Exceptions;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Security;

namespace TestCraft.Application.TestRuns;

public static class GetTestRunById
{
    /// <summary>Requests a single test run by id.</summary>
    public sealed record Query : IRequest<TestRunResponse>, IProjectScopedRequest
    {
        /// <summary>The project the run belongs to.</summary>
        public required Guid ProjectId { get; init; }

        /// <summary>The run to look up.</summary>
        public required Guid Id { get; init; }
    }

    public sealed class Handler(IApplicationDbContext context)
        : IRequestHandler<Query, TestRunResponse>
    {
        public async Task<TestRunResponse> Handle(
            Query request,
            CancellationToken cancellationToken
        ) =>
            await context
                .TestRuns.Where(r => r.Id == request.Id && r.ProjectId == request.ProjectId)
                .Select(r => new TestRunResponse
                {
                    Id = r.Id,
                    ProjectId = r.ProjectId,
                    Name = r.Name,
                    Environment = r.Environment,
                    Status = r.Status,
                    Source = r.Source,
                    ExecutedById = r.ExecutedById,
                    ExecutedByName = r.ExecutedByName,
                    CreatedAt = r.CreatedAt,
                    UpdatedAt = r.UpdatedAt,
                })
                .FirstOrDefaultAsync(cancellationToken)
            ?? throw new NotFoundException();
    }
}
