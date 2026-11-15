using MediatR;
using TestCraft.Application.Common.Extensions;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Security;

namespace TestCraft.Application.Features.TestSections;

public static class GetTestSectionById
{
    public sealed record Query : IRequest<TestSectionResponse>, IProjectScopedRequest
    {
        public required ProjectId ProjectId { get; init; }

        public required TestSuiteId SuiteId { get; init; }

        public required TestSectionId Id { get; init; }
    }

    public sealed class Handler(IApplicationDbContext context)
        : IRequestHandler<Query, TestSectionResponse>
    {
        public async Task<TestSectionResponse> Handle(
            Query request,
            CancellationToken cancellationToken
        ) =>
            await context
                .TestSections.Where(section =>
                    section.Id == request.Id
                    && section.SuiteId == request.SuiteId
                    && section.Suite!.ProjectId == request.ProjectId
                )
                .Select(TestSectionResponse.Projection)
                .FirstOrNotFoundAsync(cancellationToken);
    }
}
