using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

using TestCraft.Domain.Entities;

namespace TestCraft.Persistence.Configurations;

public class TestCaseLabelConfiguration : IEntityTypeConfiguration<TestCaseLabel>
{
    public void Configure(EntityTypeBuilder<TestCaseLabel> builder)
    {
        builder.ToTable("test_case_labels");

        builder.HasKey(tcl => new { tcl.TestCaseId, tcl.LabelId });
        builder.Property(tcl => tcl.TestCaseId).HasColumnName("test_case_id");
        builder.Property(tcl => tcl.LabelId).HasColumnName("label_id");

        builder
            .HasOne(tcl => tcl.TestCase)
            .WithMany(tc => tc.TestCaseLabels)
            .HasForeignKey(tcl => tcl.TestCaseId)
            .OnDelete(DeleteBehavior.Cascade);

        builder
            .HasOne(tcl => tcl.Label)
            .WithMany(label => label.TestCaseLabels)
            .HasForeignKey(tcl => tcl.LabelId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasQueryFilter(tcl => !tcl.TestCase!.IsDeleted);
    }
}
