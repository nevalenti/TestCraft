using MediatR;
using Microsoft.EntityFrameworkCore;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Domain.Entities;

namespace TestCraft.Application.Users;

public record AvatarUrlResponse
{
    public required string Url { get; init; }
}

public static class UploadAvatar
{
    public sealed record Command : IRequest<AvatarUrlResponse>
    {
        public required string FileName { get; init; }
        public required string ContentType { get; init; }
        public required Stream Content { get; init; }
    }

    public sealed class Handler(
        IApplicationDbContext context,
        ICurrentUser currentUser,
        IStorageService storage
    ) : IRequestHandler<Command, AvatarUrlResponse>
    {
        public async Task<AvatarUrlResponse> Handle(
            Command request,
            CancellationToken cancellationToken
        )
        {
            var userId = currentUser.UserId;

            var profile = await context.UserProfiles.FirstOrDefaultAsync(
                p => p.UserId == userId,
                cancellationToken
            );

            if (profile?.AvatarKey is not null)
            {
                try
                {
                    await storage.DeleteAsync(profile.AvatarKey, cancellationToken);
                }
                catch
                {
                    // best-effort deletion of old avatar
                }
            }

            var extension = Path.GetExtension(request.FileName);
            var storageKey = $"avatars/{userId}/{Guid.NewGuid()}{extension}";

            await storage.UploadAsync(
                storageKey,
                request.Content,
                request.ContentType,
                cancellationToken
            );

            if (profile is null)
            {
                profile = new UserProfile { UserId = userId, AvatarKey = storageKey };
                context.UserProfiles.Add(profile);
            }
            else
            {
                profile.AvatarKey = storageKey;
                profile.UpdatedAt = DateTimeOffset.UtcNow;
            }

            await context.SaveChangesAsync(cancellationToken);

            var url = await storage.GetPresignedUrlAsync(
                storageKey,
                TimeSpan.FromMinutes(60),
                cancellationToken
            );

            return new AvatarUrlResponse { Url = url };
        }
    }
}
