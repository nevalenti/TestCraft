using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

using TestCraft.Domain.Entities;

namespace TestCraft.Persistence.Configurations;

public class ShareTokenConfiguration : IEntityTypeConfiguration<ShareToken>
{
    public void Configure(EntityTypeBuilder<ShareToken> builder)
    {
        builder.ToTable("share_tokens");

        builder.ConfigureGeneratedId(st => st.Id);

        builder.Property(st => st.TestRunId).HasColumnName("test_run_id");

        builder.Property(st => st.Token).HasColumnName("token").HasMaxLength(100).IsRequired();

        builder.Property(st => st.ExpiresAt).HasColumnName("expires_at");

        builder.Property(st => st.CreatedById).HasColumnName("created_by_id");

        builder
            .Property(st => st.CreatedAt)
            .HasColumnName("created_at")
            .HasDefaultValueSql("now()");

        builder.HasIndex(st => st.Token).IsUnique();

        builder.HasIndex(st => st.TestRunId);

        builder
            .HasOne(st => st.TestRun)
            .WithMany(testRun => testRun.ShareTokens)
            .HasForeignKey(st => st.TestRunId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasQueryFilter(st => !st.TestRun!.IsDeleted && !st.TestRun.Project!.IsDeleted);
    }
}
