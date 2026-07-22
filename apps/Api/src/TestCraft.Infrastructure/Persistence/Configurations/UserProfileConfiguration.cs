using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TestCraft.Domain.Entities;

namespace TestCraft.Infrastructure.Persistence.Configurations;

public class UserProfileConfiguration : IEntityTypeConfiguration<UserProfile>
{
    public void Configure(EntityTypeBuilder<UserProfile> builder)
    {
        builder.ToTable("user_profiles");

        builder.HasKey(userProfile => userProfile.UserId);
        builder
            .Property(userProfile => userProfile.UserId)
            .HasColumnName("user_id")
            .ValueGeneratedNever();
        builder
            .Property(userProfile => userProfile.AvatarKey)
            .HasColumnName("avatar_key")
            .HasMaxLength(500);
        builder
            .Property(userProfile => userProfile.CreatedAt)
            .HasColumnName("created_at")
            .HasDefaultValueSql("now()");
        builder
            .Property(userProfile => userProfile.UpdatedAt)
            .HasColumnName("updated_at")
            .HasDefaultValueSql("now()");
    }
}
