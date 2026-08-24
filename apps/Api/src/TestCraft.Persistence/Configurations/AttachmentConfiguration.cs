using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

using TestCraft.Domain.Entities;

namespace TestCraft.Persistence.Configurations;

public class AttachmentConfiguration : IEntityTypeConfiguration<Attachment>
{
    public void Configure(EntityTypeBuilder<Attachment> builder)
    {
        builder.ToTable("attachments");

        builder.HasKey(attachment => attachment.Id);
        builder
            .Property(attachment => attachment.Id)
            .HasColumnName("id")
            .HasDefaultValueSql("gen_random_uuid()");
        builder.Property(attachment => attachment.TestResultId).HasColumnName("test_result_id");
        builder
            .Property(attachment => attachment.FileName)
            .HasColumnName("file_name")
            .HasMaxLength(255)
            .IsRequired();
        builder
            .Property(attachment => attachment.ContentType)
            .HasColumnName("content_type")
            .HasMaxLength(100)
            .IsRequired();
        builder.Property(attachment => attachment.SizeBytes).HasColumnName("size_bytes");
        builder
            .Property(attachment => attachment.StorageKey)
            .HasColumnName("storage_key")
            .HasMaxLength(500)
            .IsRequired();
        builder.Property(attachment => attachment.CreatedById).HasColumnName("created_by_id");
        builder
            .Property(attachment => attachment.CreatedAt)
            .HasColumnName("created_at")
            .HasDefaultValueSql("now()");

        builder.HasIndex(attachment => attachment.TestResultId);

        builder.HasQueryFilter(attachment => !attachment.TestResult!.IsDeleted);
    }
}
