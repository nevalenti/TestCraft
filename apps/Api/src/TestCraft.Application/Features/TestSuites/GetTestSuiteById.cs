using MediatR;
using TestCraft.Application.Common.Extensions;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Security;

namespace TestCraft.Application.Features.TestSuites;

public static class GetTestSuiteById
{
    public sealed record Query : IRequest<TestSuiteResponse>, IProjectScopedRequest
    {
        /// <summary>The project the suite belongs to.</summary>
        public required ProjectId ProjectId { get; init; }

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
                .Select(TestSuiteResponse.Projection)
                .FirstOrNotFoundAsync(cancellationToken);
    }
}
