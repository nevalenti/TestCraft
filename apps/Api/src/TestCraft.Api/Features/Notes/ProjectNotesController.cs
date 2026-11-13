using MediatR;
using Microsoft.AspNetCore.Mvc;
using TestCraft.Api.Authorization;
using TestCraft.Application.Features.Notes;

namespace TestCraft.Api.Features.Notes;

[ApiTokenScope("notes")]
[Route("api/v{version:apiVersion}/projects/{projectId:guid}/notes")]
public class ProjectNotesController(ISender sender) : NoteEndpoints(sender)
{
    [FromRoute(Name = "projectId")]
    public ProjectId ProjectId { get; set; }

    protected override NoteScope Scope => NoteScope.InProject(ProjectId);
}
