using MediatR;
using Microsoft.EntityFrameworkCore;
using TestCraft.Application.Common.Exceptions;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Security;

namespace TestCraft.Application.Attachments.Commands.DeleteAttachment;

public record DeleteAttachmentCommand : IRequest, IProjectScopedRequest
{
    public Guid ProjectId { get; init; }
    public required Guid RunId { get; init; }
    public required Guid ResultId { get; init; }
    public required Guid AttachmentId { get; init; }
}

public class DeleteAttachmentCommandHandler(IApplicationDbContext context, IStorageService storage)
    : IRequestHandler<DeleteAttachmentCommand>
{
    public async Task Handle(DeleteAttachmentCommand request, CancellationToken cancellationToken)
    {
        var attachment =
            await context.Attachments.FirstOrDefaultAsync(
                a =>
                    a.Id == request.AttachmentId
                    && a.TestResultId == request.ResultId
                    && a.TestResult!.TestRunId == request.RunId
                    && a.TestResult.TestRun!.ProjectId == request.ProjectId,
                cancellationToken
            ) ?? throw new NotFoundException();

        await storage.DeleteAsync(attachment.StorageKey, cancellationToken);

        context.Attachments.Remove(attachment);
        await context.SaveChangesAsync(cancellationToken);
    }
}
