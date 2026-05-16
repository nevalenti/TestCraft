using Domain.Entities;

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
        builder.HasQueryFilter(r => !r.IsDeleted);
        builder.HasIndex(r => r.ProjectId);

        builder.HasMany(r => r.TestResults)
            .WithOne(res => res.TestRun)
            .HasForeignKey(res => res.TestRunId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}