using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TestCraft.Domain.Entities;

namespace TestCraft.Persistence.Configurations;

public class TestSectionConfiguration : IEntityTypeConfiguration<TestSection>
{
    public void Configure(EntityTypeBuilder<TestSection> builder)
    {
        builder.ToTable("test_sections");

        builder.ConfigureVersion();

        builder.ConfigureGeneratedId(section => section.Id);

        builder.Property(section => section.SuiteId).HasColumnName("suite_id");

        builder.Property(section => section.ParentId).HasColumnName("parent_id");

        builder.Property(section => section.Name).HasColumnName("name").IsRequired();

        builder.Property(section => section.Description).HasColumnName("description");

        builder.Property(section => section.Position).HasColumnName("position");

        builder.ConfigureAuditTimestamps();

        builder.ConfigureSoftDelete();

        builder
            .HasIndex(section => new
            {
                section.SuiteId,
                section.ParentId,
                section.Name,
            })
            .HasDatabaseName("uq_test_sections_active_name")
            .IsUnique()
            .AreNullsDistinct(false)
            .HasFilter("NOT is_deleted");

        builder
            .HasOne<TestSection>()
            .WithMany()
            .HasForeignKey(section => section.ParentId)
            .OnDelete(DeleteBehavior.Restrict);

        builder
            .HasMany(section => section.TestCases)
            .WithOne(testCase => testCase.Section)
            .HasForeignKey(testCase => testCase.SectionId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
