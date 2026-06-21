using MediatR;
using Microsoft.EntityFrameworkCore;
using TestCraft.Application.Common.Exceptions;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Security;
using TestCraft.Application.Labels;

namespace TestCraft.Application.TestCases;

public static class GetTestCaseById
{
    public sealed record Query : IRequest<TestCaseResponse>, IProjectScopedRequest
    {
        public required Guid ProjectId { get; init; }
        public required Guid SuiteId { get; init; }
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
                .TestCases.Where(c => c.Id == request.Id && c.SuiteId == request.SuiteId)
                .Select(c => new TestCaseResponse
                {
                    Id = c.Id,
                    SuiteId = c.SuiteId,
                    Name = c.Name,
                    Description = c.Description,
                    Priority = c.Priority,
                    StepCount = c.Steps.Count(s => !s.IsDeleted),
                    CreatedAt = c.CreatedAt,
                    UpdatedAt = c.UpdatedAt,
                    Labels = c
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
