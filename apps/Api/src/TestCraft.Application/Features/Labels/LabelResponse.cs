using System.Linq.Expressions;
using TestCraft.Domain.Entities;

namespace TestCraft.Application.Features.Labels;

/// <summary>A colored label that can be attached to test cases.</summary>
public record LabelResponse
{
    public static readonly Expression<Func<Label, LabelResponse>> Projection =
        label => new LabelResponse
        {
            Id = label.Id,
            Version = label.Version,
            Name = label.Name,
            Color = label.Color,
            ProjectId = label.ProjectId,
        };

    private static readonly Func<Label, LabelResponse> Map = Projection.Compile();

    public static LabelResponse FromEntity(Label label) => Map(label);

    /// <summary>The label's identifier.</summary>
    public required LabelId Id { get; init; }

    /// <summary>Current version; the ETag header carries the same value.</summary>
    public required int Version { get; init; }

    /// <summary>The label's display name.</summary>
    public required string Name { get; init; }

    /// <summary>The label's color, as a "#RRGGBB" hex string.</summary>
    public required string Color { get; init; }

    /// <summary>The project the label belongs to.</summary>
    public required ProjectId ProjectId { get; init; }
}
