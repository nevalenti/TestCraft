using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

using TestCraft.Domain.Entities;

namespace TestCraft.Infrastructure.Persistence.Configurations;

public class TestResultConfiguration : IEntityTypeConfiguration<TestResult>
{
    public void Configure(EntityTypeBuilder<TestResult> builder)
    {
        builder.ToTable("test_results");

        builder.HasKey(testResult => testResult.Id);
        builder
            .Property(testResult => testResult.Id)
            .HasColumnName("id")
            .HasDefaultValueSql("gen_random_uuid()");
        builder
            .Property(testResult => testResult.Status)
            .HasColumnName("status")
            .HasConversion<string>()
            .HasMaxLength(20);
        builder.Property(testResult => testResult.Notes).HasColumnName("notes");
        builder.Property(testResult => testResult.ExecutedAt).HasColumnName("executed_at");
        builder.Property(testResult => testResult.ExecutedById).HasColumnName("executed_by_id");
        builder.Property(testResult => testResult.TestRunId).HasColumnName("test_run_id");
        builder.Property(testResult => testResult.TestCaseId).HasColumnName("test_case_id");
        builder
            .Property(testResult => testResult.CreatedAt)
            .HasColumnName("created_at")
            .HasDefaultValueSql("now()");
        builder
            .Property(testResult => testResult.UpdatedAt)
            .HasColumnName("updated_at")
            .HasDefaultValueSql("now()");
        builder
            .Property(testResult => testResult.IsDeleted)
            .HasColumnName("is_deleted")
            .HasDefaultValue(false);
        builder.Property(testResult => testResult.DeletedAt).HasColumnName("deleted_at");

        builder.Property(testResult => testResult.DurationMs).HasColumnName("duration_ms");
        builder
            .Property(testResult => testResult.DefectType)
            .HasColumnName("defect_type")
            .HasConversion<string>()
            .HasMaxLength(20);

        builder.HasIndex(testResult => testResult.TestRunId);
        builder.HasIndex(testResult => testResult.Status);
        builder.HasIndex(testResult => testResult.ExecutedAt);

        builder
            .HasMany(testResult => testResult.Attachments)
            .WithOne(attachment => attachment.TestResult)
            .HasForeignKey(attachment => attachment.TestResultId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasQueryFilter(testResult => !testResult.IsDeleted);
    }
}
