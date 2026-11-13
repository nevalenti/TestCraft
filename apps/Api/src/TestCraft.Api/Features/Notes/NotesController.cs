using MediatR;
using Microsoft.AspNetCore.Mvc;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Features.Notes;

namespace TestCraft.Api.Features.Notes;

[Route("api/v{version:apiVersion}/notes")]
public class NotesController(ISender sender, ICurrentUser currentUser) : NoteEndpoints(sender)
{
    protected override NoteScope Scope => NoteScope.Personal(currentUser.UserId);
}
