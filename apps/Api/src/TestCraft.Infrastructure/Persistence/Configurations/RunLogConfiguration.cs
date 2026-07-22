using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TestCraft.Domain.Entities;

namespace TestCraft.Infrastructure.Persistence.Configurations;

public class RunLogConfiguration : IEntityTypeConfiguration<RunLog>
{
    public void Configure(EntityTypeBuilder<RunLog> builder)
    {
        builder.ToTable("run_logs");

        builder.HasKey(runLog => runLog.Id);
        builder
            .Property(runLog => runLog.Id)
            .HasColumnName("id")
            .HasDefaultValueSql("gen_random_uuid()");
        builder.Property(runLog => runLog.RunId).HasColumnName("run_id");
        builder.Property(runLog => runLog.Message).HasColumnName("message").IsRequired();
        builder
            .Property(runLog => runLog.CreatedAt)
            .HasColumnName("created_at")
            .HasDefaultValueSql("now()");

        builder.HasIndex(runLog => new { runLog.RunId, runLog.CreatedAt });

        builder
            .HasOne(runLog => runLog.Run)
            .WithMany()
            .HasForeignKey(runLog => runLog.RunId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
