using MediatR;

using Microsoft.EntityFrameworkCore;

using TestCraft.Application.Common.Exceptions;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Security;

namespace TestCraft.Application.Features.TestSuites;

public static class GetTestSuiteById
{
    /// <summary>Requests a single test suite by id.</summary>
    public sealed record Query : IRequest<TestSuiteResponse>, IProjectScopedRequest
    {
        /// <summary>The project the suite belongs to.</summary>
        public required ProjectId ProjectId { get; init; }

        /// <summary>The suite to look up.</summary>
        public required TestSuiteId Id { get; init; }
    }

    public sealed class Handler(IApplicationDbContext context)
        : IRequestHandler<Query, TestSuiteResponse>
    {
        public async Task<TestSuiteResponse> Handle(
            Query request,
            CancellationToken cancellationToken
        ) =>
            await context
                .TestSuites.Where(suite =>
                    suite.Id == request.Id && suite.ProjectId == request.ProjectId
                )
                .Select(suite => new TestSuiteResponse
                {
                    Id = suite.Id,
                    ProjectId = suite.ProjectId,
                    Name = suite.Name,
                    Description = suite.Description,
                    Source = suite.Source,
                    CreatedAt = suite.CreatedAt,
                    UpdatedAt = suite.UpdatedAt,
                })
                .FirstOrDefaultAsync(cancellationToken)
            ?? throw new NotFoundException();
    }
}
