using TestCraft.Application.Common.Interfaces;
using TestCraft.Domain.Entities;

namespace TestCraft.Application.Features.Notes;

public sealed record NoteScope
{
    private NoteScope(UserId? ownerId, ProjectId? projectId)
    {
        OwnerId = ownerId;
        ProjectId = projectId;
    }

    public UserId? OwnerId { get; }

    public ProjectId? ProjectId { get; }

    public static NoteScope Personal(UserId ownerId) => new(ownerId, null);

    public static NoteScope InProject(ProjectId projectId) => new(null, projectId);

    public IQueryable<Note> Notes(IApplicationDbContext context) =>
        ProjectId is { } projectId
            ? context.Notes.Where(note => note.ProjectId == projectId)
            : context.Notes.Where(note => note.ProjectId == null && note.OwnerId == OwnerId);

    public string NewStorageKey() =>
        $"notes/{ProjectId?.Value.ToString() ?? OwnerId?.Value.ToString()}/{Guid.NewGuid()}";
}
