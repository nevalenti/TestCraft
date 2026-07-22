using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TestCraft.Domain.Entities;

namespace TestCraft.Infrastructure.Persistence.Configurations;

public class TestPlanConfiguration : IEntityTypeConfiguration<TestPlan>
{
    public void Configure(EntityTypeBuilder<TestPlan> builder)
    {
        builder.ToTable("test_plans");

        builder.HasKey(testPlan => testPlan.Id);
        builder
            .Property(testPlan => testPlan.Id)
            .HasColumnName("id")
            .HasDefaultValueSql("gen_random_uuid()");
        builder
            .Property(testPlan => testPlan.Name)
            .HasColumnName("name")
            .HasMaxLength(255)
            .IsRequired();
        builder.Property(testPlan => testPlan.Description).HasColumnName("description");
        builder.Property(testPlan => testPlan.ProjectId).HasColumnName("project_id");
        builder
            .Property(testPlan => testPlan.CreatedAt)
            .HasColumnName("created_at")
            .HasDefaultValueSql("now()");
        builder
            .Property(testPlan => testPlan.UpdatedAt)
            .HasColumnName("updated_at")
            .HasDefaultValueSql("now()");
        builder
            .Property(testPlan => testPlan.IsDeleted)
            .HasColumnName("is_deleted")
            .HasDefaultValue(false);
        builder.Property(testPlan => testPlan.DeletedAt).HasColumnName("deleted_at");

        builder.HasIndex(testPlan => testPlan.ProjectId);

        builder.HasQueryFilter(testPlan => !testPlan.IsDeleted);
    }
}
