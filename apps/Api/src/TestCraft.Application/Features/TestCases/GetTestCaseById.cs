using MediatR;
using Microsoft.EntityFrameworkCore;
using TestCraft.Application.Common.Exceptions;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Security;
using TestCraft.Application.Features.Labels;

namespace TestCraft.Application.Features.TestCases;

public static class GetTestCaseById
{
    /// <summary>Requests a single test case by id.</summary>
    public sealed record Query : IRequest<TestCaseResponse>, IProjectScopedRequest
    {
        /// <summary>The project the suite belongs to.</summary>
        public required Guid ProjectId { get; init; }

        /// <summary>The suite the test case belongs to.</summary>
        public required Guid SuiteId { get; init; }

        /// <summary>The test case to look up.</summary>
        public required Guid Id { get; init; }
    }

    public sealed class Handler(IApplicationDbContext context)
        : IRequestHandler<Query, TestCaseResponse>
    {
        public async Task<TestCaseResponse> Handle(
            Query request,
            CancellationToken cancellationToken
        ) =>
            await context
                .TestCases.Where(testCase =>
                    testCase.Id == request.Id && testCase.SuiteId == request.SuiteId
                )
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
                .FirstOrDefaultAsync(cancellationToken)
            ?? throw new NotFoundException();
    }
}
