using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TestCraft.Domain.Entities;

namespace TestCraft.Infrastructure.Persistence.Configurations;

public class AttachmentConfiguration : IEntityTypeConfiguration<Attachment>
{
    public void Configure(EntityTypeBuilder<Attachment> builder)
    {
        builder.ToTable("attachments");

        builder.HasKey(a => a.Id);
        builder.Property(a => a.Id).HasColumnName("id").HasDefaultValueSql("gen_random_uuid()");
        builder.Property(a => a.TestResultId).HasColumnName("test_result_id");
        builder.Property(a => a.FileName).HasColumnName("file_name").HasMaxLength(255).IsRequired();
        builder
            .Property(a => a.ContentType)
            .HasColumnName("content_type")
            .HasMaxLength(100)
            .IsRequired();
        builder.Property(a => a.SizeBytes).HasColumnName("size_bytes");
        builder
            .Property(a => a.StorageKey)
            .HasColumnName("storage_key")
            .HasMaxLength(500)
            .IsRequired();
        builder.Property(a => a.CreatedById).HasColumnName("created_by_id");
        builder.Property(a => a.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("now()");

        builder.HasIndex(a => a.TestResultId);
    }
}
