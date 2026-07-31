using MediatR;
using Microsoft.EntityFrameworkCore;
using TestCraft.Application.Common.Exceptions;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Security;

namespace TestCraft.Application.Features.Import;

public static class GetImportJobById
{
    /// <summary>Requests the status of an import job.</summary>
    public sealed record Query : IRequest<ImportJobResponse>, IProjectScopedRequest
    {
        /// <summary>The project the import job belongs to.</summary>
        public required Guid ProjectId { get; init; }

        /// <summary>The import job to look up.</summary>
        public required Guid Id { get; init; }
    }

    public sealed class Handler(IApplicationDbContext context)
        : IRequestHandler<Query, ImportJobResponse>
    {
        public async Task<ImportJobResponse> Handle(
            Query request,
            CancellationToken cancellationToken
        ) =>
            await context
                .ImportJobs.Where(job => job.Id == request.Id && job.ProjectId == request.ProjectId)
                .Select(job => new ImportJobResponse
                {
                    Id = job.Id,
                    ProjectId = job.ProjectId,
                    Status = job.Status,
                    TestRunId = job.TestRunId,
                    Error = job.Error,
                    CreatedAt = job.CreatedAt,
                    UpdatedAt = job.UpdatedAt,
                })
                .FirstOrDefaultAsync(cancellationToken)
            ?? throw new NotFoundException();
    }
}
