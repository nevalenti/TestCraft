using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

using TestCraft.Domain.Entities;

namespace TestCraft.Persistence.Configurations;

public class TestPlanConfiguration : IEntityTypeConfiguration<TestPlan>
{
    public void Configure(EntityTypeBuilder<TestPlan> builder)
    {
        builder.ToTable("test_plans");

        builder.ConfigureGeneratedId(testPlan => testPlan.Id);
        builder
            .Property(testPlan => testPlan.Name)
            .HasColumnName("name")
            .HasMaxLength(255)
            .IsRequired();
        builder.Property(testPlan => testPlan.Description).HasColumnName("description");
        builder.Property(testPlan => testPlan.ProjectId).HasColumnName("project_id");
        builder.ConfigureAuditTimestamps();
        builder.ConfigureSoftDelete();

        builder.HasIndex(testPlan => testPlan.ProjectId);
    }
}
