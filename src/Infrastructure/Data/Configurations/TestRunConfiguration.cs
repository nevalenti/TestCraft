using Domain.Entities;
using Domain.Enums;

using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Data.Configurations;

public class TestRunConfiguration : IEntityTypeConfiguration<TestRun>
{
    public void Configure(EntityTypeBuilder<TestRun> builder)
    {
        builder.HasKey(r => r.Id);
        builder.Property(r => r.Id).HasDefaultValueSql("gen_random_uuid()");
        builder.Property(r => r.Name).IsRequired().HasMaxLength(255);
        builder.Property(r => r.Environment).IsRequired().HasMaxLength(255);
        builder.Property(r => r.Status)
            .IsRequired()
            .HasConversion<string>()
            .HasMaxLength(32)
            .HasDefaultValue(TestRunStatus.Active);
        builder.HasQueryFilter(r => !r.IsDeleted);
        builder.HasIndex(r => r.ProjectId);
        builder.HasIndex(r => r.Status);

        builder.HasMany(r => r.TestResults)
            .WithOne(res => res.TestRun)
            .HasForeignKey(res => res.TestRunId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}