using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

using TestCraft.Domain.Entities;

namespace TestCraft.Persistence.Configurations;

public class TestCaseConfiguration : IEntityTypeConfiguration<TestCase>
{
    public void Configure(EntityTypeBuilder<TestCase> builder)
    {
        builder.ToTable("test_cases");

        builder.ConfigureGeneratedId(testCase => testCase.Id);

        builder.Property(testCase => testCase.Name).HasColumnName("name").IsRequired();

        builder.Property(testCase => testCase.Description).HasColumnName("description");

        builder
            .Property(testCase => testCase.Priority)
            .HasColumnName("priority")
            .HasConversion<string>()
            .HasMaxLength(20);

        builder.Property(testCase => testCase.SuiteId).HasColumnName("suite_id");

        builder.ConfigureAuditTimestamps();

        builder.ConfigureSoftDelete();

        builder.HasIndex(testCase => testCase.SuiteId);

        builder.HasIndex(testCase => testCase.Priority);

        builder
            .HasMany(testCase => testCase.Steps)
            .WithOne(testCaseStep => testCaseStep.TestCase)
            .HasForeignKey(testCaseStep => testCaseStep.TestCaseId)
            .OnDelete(DeleteBehavior.Cascade);

        builder
            .HasMany(testCase => testCase.TestResults)
            .WithOne(testResult => testResult.TestCase)
            .HasForeignKey(testResult => testResult.TestCaseId);
    }
}
