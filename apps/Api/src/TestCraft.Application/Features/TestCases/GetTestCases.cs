using MediatR;

using Microsoft.EntityFrameworkCore;

using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Pagination;
using TestCraft.Application.Common.Security;
using TestCraft.Application.Features.Labels;

namespace TestCraft.Application.Features.TestCases;

public static class GetTestCases
{
    /// <summary>Lists test cases within a suite.</summary>
    public sealed record Query : IRequest<Paginated<TestCaseResponse>>, IProjectScopedRequest
    {
        /// <summary>The project the suite belongs to.</summary>
        public ProjectId ProjectId { get; init; }

        /// <summary>The suite to list test cases for.</summary>
        public TestSuiteId SuiteId { get; init; }

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
                testCase.SuiteId == request.SuiteId
                && testCase.Suite!.ProjectId == request.ProjectId
            );

            if (!string.IsNullOrWhiteSpace(request.Search))
            {
                query = query.Where(testCase =>
                    EF.Functions.ILike(testCase.Name, $"%{request.Search}%")
                );
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
                .Select(testCase => new TestCaseResponse
                {
                    Id = testCase.Id,
                    SuiteId = testCase.SuiteId,
                    Name = testCase.Name,
                    Description = testCase.Description,
                    Priority = testCase.Priority,
                    StepCount = testCase.Steps.Count(step => !step.IsDeleted),
                    CreatedAt = testCase.CreatedAt,
                    UpdatedAt = testCase.UpdatedAt,
                    Labels = testCase
                        .TestCaseLabels.Select(tcl => new LabelResponse
                        {
                            Id = tcl.Label!.Id,
                            Name = tcl.Label.Name,
                            Color = tcl.Label.Color,
                            ProjectId = tcl.Label.ProjectId,
                        })
                        .ToList(),
                })
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
