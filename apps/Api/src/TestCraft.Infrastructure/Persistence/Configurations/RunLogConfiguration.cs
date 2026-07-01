using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TestCraft.Domain.Entities;

namespace TestCraft.Infrastructure.Persistence.Configurations;

public class RunLogConfiguration : IEntityTypeConfiguration<RunLog>
{
    public void Configure(EntityTypeBuilder<RunLog> builder)
    {
        builder.ToTable("run_logs");

        builder.HasKey(l => l.Id);
        builder.Property(l => l.Id).HasColumnName("id").HasDefaultValueSql("gen_random_uuid()");
        builder.Property(l => l.RunId).HasColumnName("run_id");
        builder.Property(l => l.Message).HasColumnName("message").IsRequired();
        builder.Property(l => l.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("now()");

        builder.HasIndex(l => new { l.RunId, l.CreatedAt });

        builder
            .HasOne(l => l.Run)
            .WithMany()
            .HasForeignKey(l => l.RunId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
