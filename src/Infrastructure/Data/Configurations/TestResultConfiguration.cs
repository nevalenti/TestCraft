using Domain.Entities;

using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Data.Configurations;

public class TestResultConfiguration : IEntityTypeConfiguration<TestResult>
{
    public void Configure(EntityTypeBuilder<TestResult> builder)
    {
        builder.HasKey(r => r.Id);
        builder.Property(r => r.Id).HasDefaultValueSql("gen_random_uuid()");
        builder.Property(r => r.Status)
            .IsRequired()
            .HasConversion<string>()
            .HasMaxLength(32);
        builder.HasQueryFilter(r => !r.IsDeleted);
        builder.HasIndex(r => r.TestRunId);
        builder.HasIndex(r => r.TestCaseId);
        builder.HasIndex(r => r.Status);
        builder.HasIndex(r => r.ExecutedAt);
    }
}