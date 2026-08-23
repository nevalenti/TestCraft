using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

using TestCraft.Domain.Entities;

namespace TestCraft.Infrastructure.Persistence.Configurations;

public class WebhookSubscriptionConfiguration : IEntityTypeConfiguration<WebhookSubscription>
{
    public void Configure(EntityTypeBuilder<WebhookSubscription> builder)
    {
        builder.ToTable("webhook_subscriptions");

        builder.HasKey(webhookSubscription => webhookSubscription.Id);
        builder
            .Property(webhookSubscription => webhookSubscription.Id)
            .HasColumnName("id")
            .HasDefaultValueSql("gen_random_uuid()");
        builder
            .Property(webhookSubscription => webhookSubscription.ProjectId)
            .HasColumnName("project_id");
        builder
            .Property(webhookSubscription => webhookSubscription.Url)
            .HasColumnName("url")
            .HasMaxLength(2000)
            .IsRequired();
        builder
            .Property(webhookSubscription => webhookSubscription.Secret)
            .HasColumnName("secret")
            .HasMaxLength(200);
        builder
            .Property(webhookSubscription => webhookSubscription.Events)
            .HasColumnName("events")
            .IsRequired();
        builder
            .Property(webhookSubscription => webhookSubscription.IsActive)
            .HasColumnName("is_active")
            .HasDefaultValue(true);
        builder
            .Property(webhookSubscription => webhookSubscription.CreatedAt)
            .HasColumnName("created_at")
            .HasDefaultValueSql("now()");

        builder.HasIndex(webhookSubscription => webhookSubscription.ProjectId);

        builder.HasQueryFilter(webhookSubscription => !webhookSubscription.Project!.IsDeleted);
    }
}
