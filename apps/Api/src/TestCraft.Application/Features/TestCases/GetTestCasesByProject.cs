using MediatR;

using Microsoft.EntityFrameworkCore;

using TestCraft.Application.Common.Extensions;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Pagination;
using TestCraft.Application.Common.Security;

namespace TestCraft.Application.Features.TestCases;

public static class GetTestCasesByProject
{
    /// <summary>Lists test cases across all suites in a project.</summary>
    public sealed record Query : IRequest<Paginated<TestCaseResponse>>, IProjectScopedRequest
    {
        /// <summary>The project to list test cases for.</summary>
        public ProjectId ProjectId { get; init; }

        /// <summary>Filters test cases whose name contains this text.</summary>
        public string? Search { get; init; }

        /// <summary>Filters test cases that have this label attached.</summary>
        public LabelId? LabelId { get; init; }

        /// <summary>The page number to return, starting at 1.</summary>
        public int? Page { get; init; }

        /// <summary>The number of test cases per page.</summary>
        public int? PageSize { get; init; }
    }

    public sealed class Handler(IApplicationDbContext context)
        : IRequestHandler<Query, Paginated<TestCaseResponse>>
    {
        public async Task<Paginated<TestCaseResponse>> Handle(
            Query request,
            CancellationToken cancellationToken
        )
        {
            var query = context.TestCases.Where(testCase =>
                testCase.Suite!.ProjectId == request.ProjectId
            );

            if (!string.IsNullOrWhiteSpace(request.Search))
            {
#pragma warning disable CA1304, CA1311
                var pattern = $"%{request.Search.ToLower()}%";
                query = query.Where(testCase =>
                    EF.Functions.Like(testCase.Name.ToLower(), pattern)
                );
#pragma warning restore CA1304, CA1311
            }

            if (request.LabelId.HasValue)
            {
                query = query.Where(testCase =>
                    testCase.TestCaseLabels.Any(tcl => tcl.LabelId == request.LabelId.Value)
                );
            }

            var pagination = PaginationParams.Create(request.Page, request.PageSize);

            var total = await query.CountAsync(cancellationToken);

            var items = await query
                .OrderBy(testCase => testCase.CreatedAt)
                .Skip(pagination.Skip)
                .Take(pagination.Take)
                .ToTestCaseResponse()
                .ToListAsync(cancellationToken);

            return new Paginated<TestCaseResponse>
            {
                Items = items,
                Total = total,
                Page = pagination.Page,
                PageSize = pagination.PageSize,
            };
        }
    }
}