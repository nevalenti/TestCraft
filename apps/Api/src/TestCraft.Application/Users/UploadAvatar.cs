using MediatR;
using Microsoft.EntityFrameworkCore;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Domain.Entities;

namespace TestCraft.Application.Users;

/// <summary>A presigned URL for a user's avatar image.</summary>
public record AvatarUrlResponse
{
    /// <summary>The presigned avatar URL.</summary>
    public required string Url { get; init; }
}

public static class UploadAvatar
{
    /// <summary>Uploads a new avatar for the current user, replacing any existing one.</summary>
    public sealed record Command : IRequest<AvatarUrlResponse>
    {
        /// <summary>The original file name.</summary>
        public required string FileName { get; init; }

        /// <summary>The file's MIME type.</summary>
        public required string ContentType { get; init; }

        /// <summary>The file content stream.</summary>
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
                catch (Exception ex)
                {
                    _ = ex;
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
