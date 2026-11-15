using MediatR;
using Microsoft.EntityFrameworkCore;
using TestCraft.Application.Common.Extensions;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Requests;
using TestCraft.Application.Common.Security;

namespace TestCraft.Application.Features.TestSections;

public static class GetTestSections
{
    /// <summary>Every section of a suite, unpaginated, so the client can build the whole tree.</summary>
    public sealed record Query : IRequest<IReadOnlyList<TestSectionResponse>>, IProjectScopedRequest
    {
        [RouteValue]
        public ProjectId ProjectId { get; init; }

        [RouteValue]
        public TestSuiteId SuiteId { get; init; }
    }

    public sealed class Handler(IApplicationDbContext context)
        : IRequestHandler<Query, IReadOnlyList<TestSectionResponse>>
    {
        public async Task<IReadOnlyList<TestSectionResponse>> Handle(
            Query request,
            CancellationToken cancellationToken
        )
        {
            await context.TestSuites.EnsureExistsAsync(
                suite => suite.Id == request.SuiteId && suite.ProjectId == request.ProjectId,
                cancellationToken
            );

            return await context
                .TestSections.Where(section => section.SuiteId == request.SuiteId)
                .OrderBy(section => section.Position)
                .ThenBy(section => section.Name)
                .Select(TestSectionResponse.Projection)
                .ToListAsync(cancellationToken);
        }
    }
}
