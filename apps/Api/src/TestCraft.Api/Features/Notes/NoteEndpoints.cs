using MediatR;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.ModelBinding;
using TestCraft.Application.Common.Pagination;
using TestCraft.Application.Features.Notes;

namespace TestCraft.Api.Features.Notes;

/// <summary>The note endpoints, shared by personal and project notes; subclasses pick the scope.</summary>
public abstract class NoteEndpoints(ISender sender) : ApiControllerBase
{
    protected abstract NoteScope Scope { get; }

    /// <summary>Lists notes, most recently updated first; search matches the title.</summary>
    [HttpGet]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<ActionResult<Paginated<NoteResponse>>> GetAll(
        [FromQuery] GetNotes.Query query,
        CancellationToken cancellationToken
    ) => Ok(await sender.Send(query with { Scope = Scope }, cancellationToken));

    /// <summary>Gets a note with its content.</summary>
    [HttpGet("{noteId:guid}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<ActionResult<NoteDetailResponse>> GetById(
        NoteId noteId,
        CancellationToken cancellationToken
    )
    {
        var result = await sender.Send(
            new GetNote.Query { Scope = Scope, Id = noteId },
            cancellationToken
        );

        SetETag(result.Version);

        return Ok(result);
    }

    /// <summary>Creates a note. Language defaults to markdown and content to empty.</summary>
    [HttpPost]
    [RequestSizeLimit(4_200_000)]
    [ProducesResponseType(StatusCodes.Status201Created)]
    public async Task<ActionResult<NoteResponse>> Create(
        CreateNote.Command command,
        CancellationToken cancellationToken
    )
    {
        var result = await sender.Send(command with { Scope = Scope }, cancellationToken);

        return CreatedAtAction(
            nameof(GetById),
            new RouteValueDictionary(RouteData.Values) { ["noteId"] = result.Id },
            result
        );
    }

    /// <summary>Replaces a note's title, language and content.</summary>
    [HttpPut("{noteId:guid}")]
    [RequestSizeLimit(4_200_000)]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status412PreconditionFailed)]
    public async Task<ActionResult<NoteResponse>> Update(
        NoteId noteId,
        UpdateNote.Command command,
        [FromHeader(Name = "If-Match"), BindRequired] string ifMatch,
        CancellationToken cancellationToken
    )
    {
        var scopedCommand = command with
        {
            Scope = Scope,
            Id = noteId,
            ExpectedVersion = ExpectedVersion(ifMatch),
        };

        var result = await sender.Send(scopedCommand, cancellationToken);

        SetETag(result.Version);

        return Ok(result);
    }

    /// <summary>Deletes a note.</summary>
    [HttpDelete("{noteId:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> Delete(NoteId noteId, CancellationToken cancellationToken)
    {
        await sender.Send(new DeleteNote.Command { Scope = Scope, Id = noteId }, cancellationToken);

        return NoContent();
    }
}
