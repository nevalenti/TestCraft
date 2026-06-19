using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TestCraft.Domain.Entities;

namespace TestCraft.Infrastructure.Persistence.Configurations;

public class WebhookSubscriptionConfiguration : IEntityTypeConfiguration<WebhookSubscription>
{
    public void Configure(EntityTypeBuilder<WebhookSubscription> builder)
    {
        builder.ToTable("webhook_subscriptions");

        builder.HasKey(w => w.Id);
        builder.Property(w => w.Id).HasColumnName("id").HasDefaultValueSql("gen_random_uuid()");
        builder.Property(w => w.ProjectId).HasColumnName("project_id");
        builder.Property(w => w.Url).HasColumnName("url").HasMaxLength(2000).IsRequired();
        builder.Property(w => w.Secret).HasColumnName("secret").HasMaxLength(200);
        builder.Property(w => w.Events).HasColumnName("events").IsRequired();
        builder.Property(w => w.IsActive).HasColumnName("is_active").HasDefaultValue(true);
        builder.Property(w => w.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("now()");

        builder.HasIndex(w => w.ProjectId);
    }
}
