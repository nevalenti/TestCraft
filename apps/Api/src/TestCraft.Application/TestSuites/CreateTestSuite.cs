using FluentValidation;
using MediatR;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Security;
using TestCraft.Domain.Entities;

namespace TestCraft.Application.TestSuites;

/// <summary>A suite grouping related test cases within a project.</summary>
public record TestSuiteResponse
{
    /// <summary>The suite's identifier.</summary>
    public required Guid Id { get; init; }

    /// <summary>The project the suite belongs to.</summary>
    public required Guid ProjectId { get; init; }

    /// <summary>The suite's display name.</summary>
    public required string Name { get; init; }

    /// <summary>The suite's description, if set.</summary>
    public string? Description { get; init; }

    /// <summary>Identifies the CI system or import source that created the suite, if any.</summary>
    public string? Source { get; init; }

    /// <summary>When the suite was created.</summary>
    public required DateTimeOffset CreatedAt { get; init; }

    /// <summary>When the suite was last updated.</summary>
    public required DateTimeOffset UpdatedAt { get; init; }
}

public static class CreateTestSuite
{
    /// <summary>Creates a new suite in a project.</summary>
    public sealed record Command : IRequest<TestSuiteResponse>, IProjectScopedRequest
    {
        /// <summary>The project to create the suite in.</summary>
        public Guid ProjectId { get; init; }

        /// <summary>The suite's display name.</summary>
        public required string Name { get; init; }

        /// <summary>The suite's description.</summary>
        public string? Description { get; init; }
    }

    public sealed class Validator : AbstractValidator<Command>
    {
        public Validator()
        {
            RuleFor(x => x.Name).NotEmpty().MaximumLength(255);
            RuleFor(x => x.Description).MaximumLength(2000);
        }
    }

    public sealed class Handler(IApplicationDbContext context)
        : IRequestHandler<Command, TestSuiteResponse>
    {
        public async Task<TestSuiteResponse> Handle(
            Command request,
            CancellationToken cancellationToken
        )
        {
            var suite = new TestSuite
            {
                ProjectId = request.ProjectId,
                Name = request.Name,
                Description = request.Description,
            };

            context.TestSuites.Add(suite);
            await context.SaveChangesAsync(cancellationToken);

            return new TestSuiteResponse
            {
                Id = suite.Id,
                ProjectId = suite.ProjectId,
                Name = suite.Name,
                Description = suite.Description,
                Source = suite.Source,
                CreatedAt = suite.CreatedAt,
                UpdatedAt = suite.UpdatedAt,
            };
        }
    }
}
