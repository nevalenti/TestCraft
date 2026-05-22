using Domain.Entities;
using Domain.Enums;

using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Data.Configurations;

public class TestCaseConfiguration : IEntityTypeConfiguration<TestCase>
{
    public void Configure(EntityTypeBuilder<TestCase> builder)
    {
        builder.HasKey(c => c.Id);
        builder.Property(c => c.Id).HasDefaultValueSql("gen_random_uuid()");
        builder.Property(c => c.Name).IsRequired().HasMaxLength(255);
        builder.Property(c => c.Priority)
            .IsRequired()
            .HasConversion<string>()
            .HasMaxLength(32)
            .HasDefaultValue(TestCasePriority.Medium);
        builder.HasQueryFilter(c => !c.IsDeleted);
        builder.HasIndex(c => c.SuiteId);
        builder.HasIndex(c => c.Priority);

        builder.HasMany(c => c.Steps)
            .WithOne(s => s.TestCase)
            .HasForeignKey(s => s.TestCaseId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(c => c.TestResults)
            .WithOne(r => r.TestCase)
            .HasForeignKey(r => r.TestCaseId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}