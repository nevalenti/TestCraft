using MediatR;
using TestCraft.Application.Common.Exceptions;
using TestCraft.Application.Common.Extensions;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Pagination;
using TestCraft.Application.Common.Requests;
using TestCraft.Application.Common.Security;
using TestCraft.Application.Features.TestSections;

namespace TestCraft.Application.Features.TestCases;

public static class GetTestCases
{
    public sealed record Query
        : TestCaseListQuery,
            IRequest<Paginated<TestCaseResponse>>,
            IProjectScopedRequest
    {
        /// <summary>The project the suite belongs to.</summary>
        [RouteValue]
        public ProjectId ProjectId { get; init; }

        [RouteValue]
        public TestSuiteId SuiteId { get; init; }

        /// <summary>Only test cases in this section.</summary>
        public TestSectionId? SectionId { get; init; }

        /// <summary>Whether to include test cases in subsections. With no section_id, false returns only the cases at the top level of the suite.</summary>
        public bool IncludeDescendants { get; init; } = true;
    }

    public sealed class Handler(IApplicationDbContext context)
        : IRequestHandler<Query, Paginated<TestCaseResponse>>
    {
        public async Task<Paginated<TestCaseResponse>> Handle(
            Query request,
            CancellationToken cancellationToken
        )
        {
            await context.TestSuites.EnsureExistsAsync(
                suite => suite.Id == request.SuiteId && suite.ProjectId == request.ProjectId,
                cancellationToken
            );

            var cases = context.TestCases.Where(testCase => testCase.SuiteId == request.SuiteId);
            if (request.SectionId is { } sectionId)
            {
                var tree = await context.LoadSectionTreeAsync(request.SuiteId, cancellationToken);
                if (tree.Find(sectionId) is null)
                {
                    throw new NotFoundException();
                }

                IReadOnlyList<TestSectionId> sectionIds = request.IncludeDescendants
                    ? tree.Subtree(sectionId)
                    : [sectionId];
                cases = cases.Where(testCase =>
                    testCase.SectionId != null && sectionIds.Contains(testCase.SectionId.Value)
                );
            }
            else if (!request.IncludeDescendants)
            {
                cases = cases.Where(testCase => testCase.SectionId == null);
            }

            return await request.ToPageAsync(cases, cancellationToken);
        }
    }
}
