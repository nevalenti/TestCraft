using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TestCraft.Domain.Entities;

namespace TestCraft.Infrastructure.Persistence.Configurations;

public class TestResultConfiguration : IEntityTypeConfiguration<TestResult>
{
    public void Configure(EntityTypeBuilder<TestResult> builder)
    {
        builder.ToTable("test_results");

        builder.HasKey(r => r.Id);
        builder.Property(r => r.Id).HasColumnName("id").HasDefaultValueSql("gen_random_uuid()");
        builder
            .Property(r => r.Status)
            .HasColumnName("status")
            .HasConversion<string>()
            .HasMaxLength(20);
        builder.Property(r => r.Notes).HasColumnName("notes");
        builder.Property(r => r.ExecutedAt).HasColumnName("executed_at");
        builder.Property(r => r.ExecutedById).HasColumnName("executed_by_id");
        builder.Property(r => r.TestRunId).HasColumnName("test_run_id");
        builder.Property(r => r.TestCaseId).HasColumnName("test_case_id");
        builder.Property(r => r.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("now()");
        builder.Property(r => r.UpdatedAt).HasColumnName("updated_at").HasDefaultValueSql("now()");
        builder.Property(r => r.IsDeleted).HasColumnName("is_deleted").HasDefaultValue(false);
        builder.Property(r => r.DeletedAt).HasColumnName("deleted_at");

        builder.Property(r => r.DurationMs).HasColumnName("duration_ms");
        builder
            .Property(r => r.DefectType)
            .HasColumnName("defect_type")
            .HasConversion<string>()
            .HasMaxLength(20);

        builder.HasIndex(r => r.TestRunId);
        builder.HasIndex(r => r.Status);
        builder.HasIndex(r => r.ExecutedAt);

        builder
            .HasMany(r => r.Attachments)
            .WithOne(a => a.TestResult)
            .HasForeignKey(a => a.TestResultId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasQueryFilter(r => !r.IsDeleted);
    }
}
