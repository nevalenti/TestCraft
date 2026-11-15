using System.Linq.Expressions;
using Microsoft.EntityFrameworkCore;
using TestCraft.Application.Common.Concurrency;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Domain.Entities;

namespace TestCraft.Application.Features.TestSections;

/// <summary>A section of a test suite: a named folder of test cases that can hold subsections.</summary>
public record TestSectionResponse : IVersionedResponse
{
    public static Task<TestSectionResponse> LoadAsync(
        IApplicationDbContext context,
        TestSectionId id,
        CancellationToken cancellationToken
    ) =>
        context
            .TestSections.Where(section => section.Id == id)
            .Select(Projection)
            .FirstAsync(cancellationToken);

    public static readonly Expression<Func<TestSection, TestSectionResponse>> Projection =
        section => new TestSectionResponse
        {
            Id = section.Id,
            Version = section.Version,
            SuiteId = section.SuiteId,
            ParentId = section.ParentId,
            Name = section.Name,
            Description = section.Description,
            Position = section.Position,
            CaseCount = section.TestCases.Count,
            CreatedAt = section.CreatedAt,
            UpdatedAt = section.UpdatedAt,
        };

    /// <summary>ID of the section.</summary>
    public required TestSectionId Id { get; init; }

    /// <summary>Current version; the ETag header carries the same value.</summary>
    public required int Version { get; init; }

    /// <summary>ID of the suite the section belongs to.</summary>
    public required TestSuiteId SuiteId { get; init; }

    /// <summary>ID of the parent section. Null means the section sits at the top level of the suite.</summary>
    public TestSectionId? ParentId { get; init; }

    /// <summary>The section's display name.</summary>
    public required string Name { get; init; }

    /// <summary>The section's description. Null when none is set.</summary>
    public string? Description { get; init; }

    /// <summary>The section's place among its siblings, lowest first.</summary>
    public required int Position { get; init; }

    /// <summary>Number of test cases directly in the section, not counting subsections.</summary>
    public required int CaseCount { get; init; }

    /// <summary>When the section was created (UTC).</summary>
    public required DateTimeOffset CreatedAt { get; init; }

    /// <summary>When the section was last updated (UTC).</summary>
    public required DateTimeOffset UpdatedAt { get; init; }
}
