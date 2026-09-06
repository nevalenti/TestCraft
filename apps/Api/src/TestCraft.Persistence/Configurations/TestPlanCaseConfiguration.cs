using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

using TestCraft.Domain.Entities;

namespace TestCraft.Persistence.Configurations;

public class TestPlanCaseConfiguration : IEntityTypeConfiguration<TestPlanCase>
{
    public void Configure(EntityTypeBuilder<TestPlanCase> builder)
    {
        builder.ToTable("test_plan_cases");

        builder.HasKey(tpc => new { tpc.TestPlanId, tpc.TestCaseId });

        builder.Property(tpc => tpc.TestPlanId).HasColumnName("test_plan_id");

        builder.Property(tpc => tpc.TestCaseId).HasColumnName("test_case_id");

        builder.Property(tpc => tpc.Order).HasColumnName("order");

        builder
            .HasOne(tpc => tpc.TestPlan)
            .WithMany(testPlan => testPlan.TestPlanCases)
            .HasForeignKey(tpc => tpc.TestPlanId)
            .OnDelete(DeleteBehavior.Cascade);

        builder
            .HasOne(tpc => tpc.TestCase)
            .WithMany(tc => tc.TestPlanCases)
            .HasForeignKey(tpc => tpc.TestCaseId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasQueryFilter(tpc => !tpc.TestPlan!.IsDeleted && !tpc.TestCase!.IsDeleted);
    }
}
