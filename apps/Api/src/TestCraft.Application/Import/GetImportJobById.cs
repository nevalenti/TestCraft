using MediatR;
using Microsoft.EntityFrameworkCore;
using TestCraft.Application.Common.Exceptions;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Security;

namespace TestCraft.Application.Import;

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
                .ImportJobs.Where(j => j.Id == request.Id && j.ProjectId == request.ProjectId)
                .Select(j => new ImportJobResponse
                {
                    Id = j.Id,
                    ProjectId = j.ProjectId,
                    Status = j.Status,
                    TestRunId = j.TestRunId,
                    Error = j.Error,
                    CreatedAt = j.CreatedAt,
                    UpdatedAt = j.UpdatedAt,
                })
                .FirstOrDefaultAsync(cancellationToken)
            ?? throw new NotFoundException();
    }
}
