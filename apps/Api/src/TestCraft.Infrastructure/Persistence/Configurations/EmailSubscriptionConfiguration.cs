using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TestCraft.Domain.Entities;

namespace TestCraft.Infrastructure.Persistence.Configurations;

public class EmailSubscriptionConfiguration : IEntityTypeConfiguration<EmailSubscription>
{
    public void Configure(EntityTypeBuilder<EmailSubscription> builder)
    {
        builder.ToTable("email_subscriptions");

        builder.HasKey(e => e.Id);
        builder.Property(e => e.Id).HasColumnName("id").HasDefaultValueSql("gen_random_uuid()");
        builder.Property(e => e.ProjectId).HasColumnName("project_id");
        builder.Property(e => e.Email).HasColumnName("email").HasMaxLength(254).IsRequired();
        builder.Property(e => e.Events).HasColumnName("events").IsRequired();
        builder.Property(e => e.IsActive).HasColumnName("is_active").HasDefaultValue(true);
        builder.Property(e => e.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("now()");

        builder.HasIndex(e => e.ProjectId);
    }
}
