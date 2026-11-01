using MediatR;
using Microsoft.AspNetCore.Mvc;
using TestCraft.Api.Authorization;
using TestCraft.Application.Features.Notes;

namespace TestCraft.Api.Features.Notes;

/// <summary>Notes shared within a project.</summary>
[ApiTokenScope("notes")]
[Route("api/v{version:apiVersion}/projects/{projectId:guid}/notes")]
public class ProjectNotesController(ISender sender) : NoteEndpoints(sender)
{
    protected override NoteScope Scope =>
        NoteScope.InProject(ProjectId.From(Guid.Parse((string)RouteData.Values["projectId"]!)));
}
