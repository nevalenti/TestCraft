using FluentValidation;

using MediatR;

using Microsoft.EntityFrameworkCore;

using TestCraft.Application.Common.Exceptions;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Security;
using TestCraft.Application.Features.Labels;
using TestCraft.Domain.Enums;

namespace TestCraft.Application.Features.TestCases;

public static class UpdateTestCase
{
    /// <summary>Updates a test case's name, description, and priority.</summary>
    public sealed record Command : IRequest<TestCaseResponse>, IProjectScopedRequest
    {
        /// <summary>The project the suite belongs to.</summary>
        [System.Text.Json.Serialization.JsonIgnore]
        public ProjectId ProjectId { get; init; }

        /// <summary>The suite the test case belongs to.</summary>
        [System.Text.Json.Serialization.JsonIgnore]
        public TestSuiteId SuiteId { get; init; }

        /// <summary>The test case to update.</summary>
        [System.Text.Json.Serialization.JsonIgnore]
        public TestCaseId Id { get; init; }

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
            RuleFor(command => command.Name).NotEmpty().MaximumLength(255);
            RuleFor(command => command.Description).MaximumLength(2000);
            RuleFor(command => command.Priority).IsInEnum();
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
                    existingTestCase =>
                        existingTestCase.Id == request.Id
                        && existingTestCase.SuiteId == request.SuiteId
                        && existingTestCase.Suite!.ProjectId == request.ProjectId,
                    cancellationToken
                ) ?? throw new NotFoundException();

            testCase.Update(request.Name, request.Description, request.Priority);

            await context.SaveChangesAsync(cancellationToken);

            return await context
                .TestCases.Where(updatedTestCase => updatedTestCase.Id == testCase.Id)
                .Select(updatedTestCase => new TestCaseResponse
                {
                    Id = updatedTestCase.Id,
                    SuiteId = updatedTestCase.SuiteId,
                    Name = updatedTestCase.Name,
                    Description = updatedTestCase.Description,
                    Priority = updatedTestCase.Priority,
                    StepCount = updatedTestCase.Steps.Count(step => !step.IsDeleted),
                    CreatedAt = updatedTestCase.CreatedAt,
                    UpdatedAt = updatedTestCase.UpdatedAt,
                    Labels = updatedTestCase
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
