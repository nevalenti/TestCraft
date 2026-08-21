using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using TestCraft.Application.Common.Exceptions;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Security;
using TestCraft.Application.Features.Labels;
using TestCraft.Domain.Entities;
using TestCraft.Domain.Enums;

namespace TestCraft.Application.Features.TestCases;

/// <summary>A test case within a suite.</summary>
public record TestCaseResponse
{
    /// <summary>The test case's identifier.</summary>
    public required TestCaseId Id { get; init; }

    /// <summary>The suite the test case belongs to.</summary>
    public required TestSuiteId SuiteId { get; init; }

    /// <summary>The test case's display name.</summary>
    public required string Name { get; init; }

    /// <summary>The test case's description, if set.</summary>
    public string? Description { get; init; }

    /// <summary>The test case's priority.</summary>
    public required TestCasePriority Priority { get; init; }

    /// <summary>The number of non-deleted steps in the test case.</summary>
    public required int StepCount { get; init; }

    /// <summary>When the test case was created.</summary>
    public required DateTimeOffset CreatedAt { get; init; }

    /// <summary>When the test case was last updated.</summary>
    public required DateTimeOffset UpdatedAt { get; init; }

    /// <summary>The labels attached to the test case.</summary>
    public IReadOnlyList<LabelResponse> Labels { get; init; } = [];
}

public static class CreateTestCase
{
    /// <summary>Creates a new test case in a suite.</summary>
    public sealed record Command : IRequest<TestCaseResponse>, IProjectScopedRequest
    {
        /// <summary>The project the suite belongs to.</summary>
        [System.Text.Json.Serialization.JsonIgnore]
        public ProjectId ProjectId { get; init; }

        /// <summary>The suite to create the test case in.</summary>
        [System.Text.Json.Serialization.JsonIgnore]
        public TestSuiteId SuiteId { get; init; }

        /// <summary>The test case's display name.</summary>
        public required string Name { get; init; }

        /// <summary>The test case's description.</summary>
        public string? Description { get; init; }

        /// <summary>The test case's priority. Defaults to Medium if omitted.</summary>
        public TestCasePriority? Priority { get; init; }
    }

    public sealed class Validator : AbstractValidator<Command>
    {
        public Validator()
        {
            RuleFor(command => command.Name).NotEmpty().MaximumLength(255);
            RuleFor(command => command.Description).MaximumLength(2000);
            RuleFor(command => command.Priority)
                .IsInEnum()
                .When(command => command.Priority is not null);
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
            var suiteExists = await context.TestSuites.AnyAsync(
                suite => suite.Id == request.SuiteId && suite.ProjectId == request.ProjectId,
                cancellationToken
            );
            if (!suiteExists)
            {
                throw new NotFoundException();
            }

            var testCase = new TestCase
            {
                Id = TestCaseId.New(),
                SuiteId = request.SuiteId,
                Name = request.Name,
                Description = request.Description,
                Priority = request.Priority ?? TestCasePriority.Medium,
            };

            context.TestCases.Add(testCase);
            await context.SaveChangesAsync(cancellationToken);

            return new TestCaseResponse
            {
                Id = testCase.Id,
                SuiteId = testCase.SuiteId,
                Name = testCase.Name,
                Description = testCase.Description,
                Priority = testCase.Priority,
                StepCount = 0,
                CreatedAt = testCase.CreatedAt,
                UpdatedAt = testCase.UpdatedAt,
                Labels = [],
            };
        }
    }
}
