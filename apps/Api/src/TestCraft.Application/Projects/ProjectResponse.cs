using System.Linq.Expressions;
using TestCraft.Domain.Entities;

namespace TestCraft.Application.Projects;

public record ProjectResponse
{
    public required Guid Id { get; init; }
    public required string Name { get; init; }
    public string? Description { get; init; }
    public required DateTimeOffset CreatedAt { get; init; }
    public required DateTimeOffset UpdatedAt { get; init; }
    public required int SuiteCount { get; init; }
    public required int RunCount { get; init; }

    internal static readonly Expression<
        Func<Project, ProjectResponse>
    > Projection = p => new ProjectResponse
    {
        Id = p.Id,
        Name = p.Name,
        Description = p.Description,
        CreatedAt = p.CreatedAt,
        UpdatedAt = p.UpdatedAt,
        SuiteCount = p.TestSuites.Count(s => !s.IsDeleted),
        RunCount = p.TestRuns.Count(r => !r.IsDeleted),
    };
}
