using MediatR;
using Microsoft.EntityFrameworkCore;
using TestCraft.Application.Common.Exceptions;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Security;

namespace TestCraft.Application.TestSuites;

public static class GetTestSuiteById
{
    /// <summary>Requests a single test suite by id.</summary>
    public sealed record Query : IRequest<TestSuiteResponse>, IProjectScopedRequest
    {
        /// <summary>The project the suite belongs to.</summary>
        public required Guid ProjectId { get; init; }

        /// <summary>The suite to look up.</summary>
        public required Guid Id { get; init; }
    }

    public sealed class Handler(IApplicationDbContext context)
        : IRequestHandler<Query, TestSuiteResponse>
    {
        public async Task<TestSuiteResponse> Handle(
            Query request,
            CancellationToken cancellationToken
        ) =>
            await context
                .TestSuites.Where(s => s.Id == request.Id && s.ProjectId == request.ProjectId)
                .Select(s => new TestSuiteResponse
                {
                    Id = s.Id,
                    ProjectId = s.ProjectId,
                    Name = s.Name,
                    Description = s.Description,
                    Source = s.Source,
                    CreatedAt = s.CreatedAt,
                    UpdatedAt = s.UpdatedAt,
                })
                .FirstOrDefaultAsync(cancellationToken)
            ?? throw new NotFoundException();
    }
}
