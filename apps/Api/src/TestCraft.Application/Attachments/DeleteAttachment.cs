using MediatR;
using Microsoft.EntityFrameworkCore;
using TestCraft.Application.Common.Exceptions;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Security;

namespace TestCraft.Application.Attachments;

public static class DeleteAttachment
{
    /// <summary>Deletes an attachment and its stored file.</summary>
    public sealed record Command : IRequest, IProjectScopedRequest
    {
        /// <summary>The project the attachment belongs to.</summary>
        public Guid ProjectId { get; init; }

        /// <summary>The run the attachment belongs to.</summary>
        public required Guid RunId { get; init; }

        /// <summary>The test result the attachment belongs to.</summary>
        public required Guid ResultId { get; init; }

        /// <summary>The attachment to delete.</summary>
        public required Guid AttachmentId { get; init; }
    }

    public sealed class Handler(IApplicationDbContext context, IStorageService storage)
        : IRequestHandler<Command>
    {
        public async Task Handle(Command request, CancellationToken cancellationToken)
        {
            var attachment =
                await context.Attachments.FirstOrDefaultAsync(
                    attachmentEntity =>
                        attachmentEntity.Id == request.AttachmentId
                        && attachmentEntity.TestResultId == request.ResultId
                        && attachmentEntity.TestResult!.TestRunId == request.RunId
                        && attachmentEntity.TestResult.TestRun!.ProjectId == request.ProjectId,
                    cancellationToken
                ) ?? throw new NotFoundException();

            await storage.DeleteAsync(attachment.StorageKey, cancellationToken);

            context.Attachments.Remove(attachment);
            await context.SaveChangesAsync(cancellationToken);
        }
    }
}
