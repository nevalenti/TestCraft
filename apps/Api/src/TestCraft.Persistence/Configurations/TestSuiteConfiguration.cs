using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TestCraft.Domain.Entities;

namespace TestCraft.Persistence.Configurations;

public class TestSuiteConfiguration : IEntityTypeConfiguration<TestSuite>
{
    public void Configure(EntityTypeBuilder<TestSuite> builder)
    {
        builder.ToTable("test_suites");

        builder.ConfigureVersion();

        builder.ConfigureGeneratedId(testSuite => testSuite.Id);

        builder.Property(testSuite => testSuite.Name).HasColumnName("name").IsRequired();

        builder.Property(testSuite => testSuite.Description).HasColumnName("description");

        builder.Property(testSuite => testSuite.Source).HasColumnName("source");

        builder.Property(testSuite => testSuite.ProjectId).HasColumnName("project_id");

        builder.ConfigureAuditTimestamps();

        builder.ConfigureSoftDelete();

        builder.HasIndex(testSuite => testSuite.ProjectId);

        builder
            .HasIndex(testSuite => new { testSuite.ProjectId, testSuite.Name })
            .HasDatabaseName("uq_test_suites_active_name")
            .IsUnique()
            .HasFilter("NOT is_deleted");

        builder
            .HasMany(testSuite => testSuite.TestCases)
            .WithOne(testCase => testCase.Suite)
            .HasForeignKey(testCase => testCase.SuiteId);
    }
}
