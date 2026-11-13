using MediatR;
using Microsoft.EntityFrameworkCore;
using TestCraft.Application.Common.Extensions;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Security;

namespace TestCraft.Application.Features.Attachments;

public static class DeleteAttachment
{
    public sealed record Command : IRequest, IProjectScopedRequest
    {
        [JsonIgnore]
        public ProjectId ProjectId { get; init; }

        public required TestRunId RunId { get; init; }

        public required TestResultId ResultId { get; init; }

        public required AttachmentId AttachmentId { get; init; }
    }

    public sealed class Handler(IApplicationDbContext context, IStorageService storage)
        : IRequestHandler<Command>
    {
        public async Task Handle(Command request, CancellationToken cancellationToken)
        {
            var attachment = await context
                .Attachments.Include(entity => entity.TestResult)
                    .ThenInclude(result => result!.TestRun)
                .FirstOrNotFoundAsync(
                    attachmentEntity =>
                        attachmentEntity.Id == request.AttachmentId
                        && attachmentEntity.TestResultId == request.ResultId
                        && attachmentEntity.TestResult!.TestRunId == request.RunId
                        && attachmentEntity.TestResult.TestRun!.ProjectId == request.ProjectId,
                    cancellationToken
                );

            attachment.TestResult!.TestRun!.EnsureCanAddResult();

            await storage.DeleteAsync(attachment.StorageKey, cancellationToken);

            context.Attachments.Remove(attachment);

            await context.SaveChangesAsync(cancellationToken);
        }
    }
}
