using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace TestCraft.Persistence.Configurations;

public sealed class IdempotencyRecordConfiguration : IEntityTypeConfiguration<IdempotencyRecord>
{
    public void Configure(EntityTypeBuilder<IdempotencyRecord> builder)
    {
        builder.ToTable("idempotency_records");
        builder.HasKey(record => record.Id);
        builder.Property(record => record.Id).HasColumnName("id");
        builder.Property(record => record.Principal).HasColumnName("principal").HasMaxLength(100);
        builder.Property(record => record.Key).HasColumnName("key").HasMaxLength(255);
        builder
            .Property(record => record.RequestHash)
            .HasColumnName("request_hash")
            .HasMaxLength(64);
        builder.Property(record => record.StatusCode).HasColumnName("status_code");
        builder.Property(record => record.ResponseBody).HasColumnName("response_body");
        builder.Property(record => record.ContentType).HasColumnName("content_type");
        builder.Property(record => record.Location).HasColumnName("location");
        builder.Property(record => record.CreatedAt).HasColumnName("created_at");
        builder.HasIndex(record => new { record.Principal, record.Key }).IsUnique();
        builder.HasIndex(record => record.CreatedAt);
    }
}
