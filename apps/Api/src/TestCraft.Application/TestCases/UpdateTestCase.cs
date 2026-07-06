using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using TestCraft.Application.Common.Exceptions;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Security;
using TestCraft.Application.Labels;
using TestCraft.Domain.Enums;

namespace TestCraft.Application.TestCases;

public static class UpdateTestCase
{
    /// <summary>Updates a test case's name, description, and priority.</summary>
    public sealed record Command : IRequest<TestCaseResponse>, IProjectScopedRequest
    {
        /// <summary>The project the suite belongs to.</summary>
        public Guid ProjectId { get; init; }

        /// <summary>The suite the test case belongs to.</summary>
        public Guid SuiteId { get; init; }

        /// <summary>The test case to update.</summary>
        public Guid Id { get; init; }

        /// <summary>The test case's new display name.</summary>
        public required string Name { get; init; }

        /// <summary>The test case's new description.</summary>
        public string? Description { get; init; }

        /// <summary>The test case's new priority.</summary>
        public required TestCasePriority Priority { get; init; }
    }

    public sealed class Validator : AbstractValidator<Command>
    {
        public Validator()
        {
            RuleFor(x => x.Name).NotEmpty().MaximumLength(255);
            RuleFor(x => x.Description).MaximumLength(2000);
            RuleFor(x => x.Priority).IsInEnum();
        }
    }

    public sealed class Handler(IApplicationDbContext context)
        : IRequestHandler<Command, TestCaseResponse>
    {
        public async Task<TestCaseResponse> Handle(
            Command request,
            CancellationToken cancellationToken
        )
        {
            var testCase =
                await context.TestCases.FirstOrDefaultAsync(
                    c => c.Id == request.Id && c.SuiteId == request.SuiteId,
                    cancellationToken
                ) ?? throw new NotFoundException();

            testCase.Update(request.Name, request.Description, request.Priority);

            await context.SaveChangesAsync(cancellationToken);

            return await context
                .TestCases.Where(c => c.Id == testCase.Id)
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
                .FirstAsync(cancellationToken);
        }
    }
}
